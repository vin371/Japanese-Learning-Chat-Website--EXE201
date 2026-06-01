using System.Text;
using backend.Authorization;
using backend.Data;
using backend.Services.AI;
using backend.Services.Admin;
using backend.Services.Assessment;
using backend.Services.Auth;
using backend.Services.Email;
using backend.Hubs;
using backend.Services.Chat;
using backend.Services.Chatbot;
using backend.Services.Game;
using backend.Services.Learning;
using backend.Services.Moderation;
using backend.Services.Payment;
using backend.Services.Social;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Text.Json;

namespace backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Supabase/PostgreSQL: cột timestamp (không time zone) — tương thích DateTime UTC từ code SQL Server cũ
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

            var builder = WebApplication.CreateBuilder(args);
            // OpenAI ApiKey: đặt trong appsettings.Secrets.json (đã .gitignore) hoặc User Secrets — xem OPENAI-CAU-HINH.txt
            builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

            // Railway Variables: JWT_KEY (không tự map sang Jwt:Key)
            var jwtEnv = Environment.GetEnvironmentVariable("JWT_KEY");
            if (!string.IsNullOrWhiteSpace(jwtEnv))
                builder.Configuration["Jwt:Key"] = jwtEnv;

            // Upload multipart (PDF/DOCX/PPTX) — đồng bộ với [RequestSizeLimit] trên controller import
            builder.WebHost.ConfigureKestrel(o =>
            {
                o.Limits.MaxRequestBodySize = 32_000_000;
            });

            // PostgreSQL / Supabase – YUMEGO-JI
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(connectionString, npgsql =>
                {
                    npgsql.EnableRetryOnFailure();
                });
            });

            builder.Services.AddMemoryCache();

            // YUMEGO-JI: Đăng ký 10 mô-đun theo đặc tả hệ thống
            builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<ILearningService, LearningService>();
            builder.Services.AddScoped<IAssessmentService, AssessmentService>();
            builder.Services.AddScoped<IGameService, GameService>();
            builder.Services.AddScoped<IChatService, ChatService>();
            builder.Services.AddSingleton<IChatRealtimePublisher, ChatRealtimePublisher>();
            builder.Services.AddScoped<ISocialService, SocialService>();
            builder.Services.AddScoped<IModerationService, ModerationService>();
            builder.Services.AddScoped<IAdminService, AdminService>();
            builder.Services.AddScoped<IPaymentService, PaymentService>();
            builder.Services.AddScoped<IAIService, AIService>();
            builder.Services.AddHttpClient(nameof(GoogleGeminiService), client =>
            {
                client.Timeout = TimeSpan.FromMinutes(6);
            });
            builder.Services.AddSingleton<IGoogleGeminiService, GoogleGeminiService>();
            builder.Services.AddHttpClient(nameof(LearnOllamaAssistantService), client =>
            {
                client.Timeout = TimeSpan.FromMinutes(3);
            });
            builder.Services.AddScoped<ILearnOllamaAssistantService, LearnOllamaAssistantService>();
            builder.Services.AddHttpClient(nameof(SupportChatbotService), client =>
            {
                client.Timeout = TimeSpan.FromMinutes(2);
            });
            builder.Services.AddScoped<ISupportChatbotService, SupportChatbotService>();
            builder.Services.AddHttpClient(nameof(LessonAiImportService));
            builder.Services.AddScoped<ILessonAiImportService, LessonAiImportService>();

            builder.Services.Configure<FormOptions>(o =>
            {
                o.MultipartBodyLengthLimit = 32_000_000;
            });

            // JWT Authentication
            var jwtSection = builder.Configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSection["Key"] ?? "change-this-secret-key");

            builder.Services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSection["Issuer"],
                        ValidAudience = jwtSection["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(key)
                    };
                    // SignalR WebSocket không gửi Authorization header — dùng ?access_token=...
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) &&
                                path.StartsWithSegments("/hubs/chat"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy(AuthPolicies.Member, p =>
                    p.RequireRole(AppRoles.User, AppRoles.Moderator, AppRoles.Admin));
                options.AddPolicy(AuthPolicies.Staff, p =>
                    p.RequireRole(AppRoles.Moderator, AppRoles.Admin));
                options.AddPolicy(AuthPolicies.AdminOnly, p =>
                    p.RequireRole(AppRoles.Admin));
            });

            builder.Services.AddControllers().AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
                o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });
            builder.Services.AddSignalR();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Yumegoji API", Version = "v1" });

                // Nút "Authorize" trên Swagger UI — dán JWT sau khi POST /api/Auth/login
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description =
                        "Nhập JWT. Chỉ dán **chuỗi token** (Swagger tự thêm tiền tố Bearer). Ví dụ: eyJhbGciOiJIUzI1NiIs...",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = JwtBearerDefaults.AuthenticationScheme,
                    BearerFormat = "JWT"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // CORS for frontend (Vite can run on 8080/8081/8082/...)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("FrontendDev", policy =>
                {
                    policy
                        .SetIsOriginAllowed(origin =>
                        {
                            if (string.IsNullOrWhiteSpace(origin)) return false;
                            if (origin.Equals("https://yumegoji.vercel.app", StringComparison.OrdinalIgnoreCase))
                                return true;
                            if (origin == "https://japanese-learning-chat-website.vercel.app") return true;

                            var configuredFront = builder.Configuration["Frontend:PublicBaseUrl"];
                            if (!string.IsNullOrWhiteSpace(configuredFront)
                                && origin.Equals(configuredFront.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
                                return true;

                            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                            {
                                if (uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) &&
                                    uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                                    return true;

                                if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                                    uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                                    uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase))
                                    return true;
                            }

                            return false;
                        })
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            var app = builder.Build();

            // CORS sớm — phản hồi lỗi 500 vẫn có Access-Control-Allow-Origin (tránh trình duyệt báo CORS sai)
            app.UseCors("FrontendDev");

            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler(errorApp =>
                {
                    errorApp.Run(async context =>
                    {
                        var log = context.RequestServices.GetRequiredService<ILogger<Program>>();
                        var feat = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
                        if (feat?.Error != null)
                            log.LogError(feat.Error, "Unhandled error {Path}", context.Request.Path);

                        if (!context.Response.HasStarted)
                        {
                            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                            context.Response.ContentType = "application/json";
                            await context.Response.WriteAsJsonAsync(new { message = "Lỗi máy chủ." });
                        }
                    });
                });
            }

            // Kiểm tra kết nối Supabase khi khởi động (mật khẩu trong appsettings.Secrets.json)
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var log = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                try
                {
                    if (db.Database.CanConnect())
                        log.LogInformation("Đã kết nối PostgreSQL (Supabase) thành công.");
                    else
                        log.LogWarning("Không kết nối được database — kiểm tra ConnectionStrings trong appsettings.Secrets.json.");
                }
                catch (Exception ex)
                {
                    log.LogError(ex, "Lỗi kết nối Supabase — dùng Session pooler (aws-1-<region>.pooler.supabase.com) trong appsettings.Secrets.json.");
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Avoid dev surprises when frontend calls http://localhost:5056
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseRouting();

            // Phục vụ file tĩnh từ wwwroot (vd: /uploads/ảnh đã upload)
            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<ChatHub>("/hubs/chat");

            app.Run();
        }
    }
}
