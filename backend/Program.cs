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
using Npgsql;
using System;
using System.Text.Json;

namespace backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "import-n5-docx")
            {
                ImportN5DocxEntry(args).GetAwaiter().GetResult();
                return;
            }

            if (args.Length > 0 && args[0] == "import-n4-docx")
            {
                ImportN4DocxEntry(args).GetAwaiter().GetResult();
                return;
            }

            if (args.Length > 0 && args[0] == "import-n3-docx")
            {
                ImportN3DocxEntry(args).GetAwaiter().GetResult();
                return;
            }

            if (args.Length > 0 && args[0] == "apply-sql")
            {
                ApplySqlEntry(args).GetAwaiter().GetResult();
                return;
            }

            // Supabase/PostgreSQL: cột timestamp (không time zone) — tương thích DateTime UTC từ code SQL Server cũ
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

            var builder = WebApplication.CreateBuilder(args);

            // Railway / Docker: bắt buộc lắng nghe $PORT trên 0.0.0.0 (proxy không tới được localhost).
            // Dev local: không ghi đè — dùng applicationUrl trong launchSettings (mặc định :5056, tránh trùng Vite :8080).
            var portEnv = Environment.GetEnvironmentVariable("PORT");
            if (!string.IsNullOrWhiteSpace(portEnv))
            {
                var listenPort = portEnv.Trim();
                builder.WebHost.UseUrls($"http://0.0.0.0:{listenPort}");
                Console.WriteLine($"[yumegoji] Kestrel -> http://0.0.0.0:{listenPort} (PORT env={portEnv})");
            }

            // OpenAI ApiKey: đặt trong appsettings.Secrets.json (đã .gitignore) hoặc User Secrets — xem OPENAI-CAU-HINH.txt
            // Lưu ý: AddJsonFile sau CreateBuilder có độ ưu tiên cao hơn env → phải ghi đè lại từ env bên dưới.
            builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

            // Railway Variables: JWT_KEY hoặc Jwt__Key
            var jwtEnv = Environment.GetEnvironmentVariable("JWT_KEY")
                ?? Environment.GetEnvironmentVariable("Jwt__Key");
            if (!string.IsNullOrWhiteSpace(jwtEnv))
                builder.Configuration["Jwt:Key"] = jwtEnv;

            // Railway Variables phải thắng Secrets.json (nếu file vô tình có trong image)
            var csEnv = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (!string.IsNullOrWhiteSpace(csEnv))
                builder.Configuration["ConnectionStrings:DefaultConnection"] = csEnv.Trim();

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

            // CORS sớm + đảm bảo header CORS cả khi 500 (tránh Vercel báo CORS thay vì lỗi thật)
            app.UseCors("FrontendDev");
            app.Use(async (context, next) =>
            {
                var origin = context.Request.Headers.Origin.ToString();
                if (!string.IsNullOrEmpty(origin))
                {
                    context.Response.OnStarting(() =>
                    {
                        if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
                            context.Response.Headers.Append("Access-Control-Allow-Origin", origin);
                        if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Credentials"))
                            context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
                        return Task.CompletedTask;
                    });
                }

                await next();
            });

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

            // Kiểm tra DB nền — không chặn lắng nghe PORT (Railway 502 nếu CanConnect treo/retry lâu)
            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(500);
                    using var scope = app.Services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var log = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    var cs = app.Configuration.GetConnectionString("DefaultConnection");
                    try
                    {
                        var csb = new NpgsqlConnectionStringBuilder(cs ?? "");
                        log.LogInformation(
                            "DB config: Host={Host}; Port={Port}; Username={Username}; PasswordLen={PasswordLen}; HasEnvOverride={HasEnv}",
                            csb.Host,
                            csb.Port,
                            csb.Username,
                            string.IsNullOrEmpty(csb.Password) ? 0 : csb.Password.Length,
                            !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")));
                    }
                    catch (Exception parseEx)
                    {
                        log.LogWarning(parseEx, "Không parse được ConnectionStrings:DefaultConnection.");
                    }

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                    await db.Database.OpenConnectionAsync(cts.Token);
                    await db.Database.CloseConnectionAsync();
                    log.LogInformation("Đã kết nối PostgreSQL (Supabase) thành công.");
                    if (!string.IsNullOrWhiteSpace(cs))
                        await StartupDbPatches.ApplyUserInventoryTimestampDefaultsAsync(cs, log, cts.Token);
                }
                catch (Exception ex)
                {
                    var log = app.Services.GetRequiredService<ILogger<Program>>();
                    log.LogError(
                        ex,
                        "Lỗi kết nối Supabase khi khởi động. Kiểm tra Host=aws-1-... (không aws-0), Password đúng, và ConnectionStrings__DefaultConnection trên Railway. Chi tiết: {Message}",
                        ex.GetBaseException().Message);
                }
            });

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Railway: TLS ở edge, container chỉ HTTP — redirect HTTPS làm health check / proxy lỗi
            var onRailway = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT"));
            if (!app.Environment.IsDevelopment() && !onRailway)
                app.UseHttpsRedirection();

            app.UseRouting();

            // Phục vụ file tĩnh từ wwwroot (vd: /uploads/ảnh đã upload)
            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapGet("/", () => Results.Ok(new
            {
                service = "yumegoji-api",
                status = "ok",
                health = "/health",
                api = "/api",
                swagger = "/swagger"
            }));
            app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "yumegoji-api" }));

            app.MapControllers();
            app.MapHub<ChatHub>("/hubs/chat");

            app.Run();
        }

        private static async Task ImportN5DocxEntry(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var dryRun = args.Contains("--dry-run", StringComparer.OrdinalIgnoreCase);
            var importDir = args.FirstOrDefault(a =>
                !a.StartsWith("--", StringComparison.Ordinal) &&
                !string.Equals(a, "import-n5-docx", StringComparison.OrdinalIgnoreCase));

            var builder = WebApplication.CreateBuilder();
            builder.Configuration.AddJsonFile("appsettings.json", optional: false);
            builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
            builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(connectionString);
            });

            var app = builder.Build();
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var dir = string.IsNullOrWhiteSpace(importDir)
                ? Path.Combine(Directory.GetCurrentDirectory(), "doc", "import")
                : Path.GetFullPath(importDir);

            await N5DocxCourseImporter.RunAsync(db, dir, dryRun);
        }

        private static async Task ImportN4DocxEntry(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var dryRun = args.Contains("--dry-run", StringComparer.OrdinalIgnoreCase);
            var importDir = args.FirstOrDefault(a =>
                !a.StartsWith("--", StringComparison.Ordinal) &&
                !string.Equals(a, "import-n4-docx", StringComparison.OrdinalIgnoreCase));

            var builder = WebApplication.CreateBuilder();
            builder.Configuration.AddJsonFile("appsettings.json", optional: false);
            builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
            builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(connectionString);
            });

            var app = builder.Build();
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var dir = string.IsNullOrWhiteSpace(importDir)
                ? Path.Combine(Directory.GetCurrentDirectory(), "doc", "import", "n4")
                : Path.GetFullPath(importDir);

            await N4DocxCourseImporter.RunAsync(db, dir, dryRun);
        }

        private static async Task ImportN3DocxEntry(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var dryRun = args.Contains("--dry-run", StringComparer.OrdinalIgnoreCase);
            var useDocker = args.Contains("--docker", StringComparer.OrdinalIgnoreCase);
            var importDir = args.FirstOrDefault(a =>
                !a.StartsWith("--", StringComparison.Ordinal) &&
                !string.Equals(a, "import-n3-docx", StringComparison.OrdinalIgnoreCase));

            var builder = WebApplication.CreateBuilder();
            builder.Configuration.AddJsonFile("appsettings.json", optional: false);
            builder.Configuration.AddJsonFile("appsettings.Development.json", optional: true);
            builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);
            if (useDocker)
                builder.Configuration.AddJsonFile("appsettings.Docker.json", optional: false, reloadOnChange: false);

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(connectionString);
            });

            var app = builder.Build();
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var dir = string.IsNullOrWhiteSpace(importDir)
                ? Path.Combine(Directory.GetCurrentDirectory(), "doc", "import", "n3")
                : Path.GetFullPath(importDir);

            await N3DocxCourseImporter.RunAsync(db, dir, dryRun);
        }

        private static async Task ApplySqlEntry(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var sqlPath = args.FirstOrDefault(a =>
                !string.Equals(a, "apply-sql", StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(sqlPath))
            {
                Console.Error.WriteLine("Usage: dotnet run -- apply-sql <path-to.sql>");
                Environment.Exit(1);
                return;
            }

            var fullPath = Path.GetFullPath(sqlPath);
            if (!File.Exists(fullPath))
            {
                Console.Error.WriteLine($"File not found: {fullPath}");
                Environment.Exit(1);
                return;
            }

            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddJsonFile("appsettings.Secrets.json", optional: true);

            var cs = builder.Build().GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(cs))
            {
                Console.Error.WriteLine("ConnectionStrings:DefaultConnection chưa cấu hình.");
                Environment.Exit(1);
                return;
            }

            var sql = await File.ReadAllTextAsync(fullPath);
            await using var conn = new NpgsqlConnection(cs);
            await conn.OpenAsync();
            await using var cmd = new NpgsqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine($"Applied SQL patch: {fullPath}");
        }
    }
}
