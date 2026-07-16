# Deploy backend lên Railway (YumeGo-ji) — DB = Supabase

## 1. Cấu hình service

- **GitHub repo** → branch `main`
- **Root directory:** để **trống** (repo gốc có `Dockerfile` + `railway.toml`)
- **Builder:** Dockerfile (chỉ đóng gói API; **không** chạy Postgres trong container)
- Database: **Supabase** (Session pooler)

## 2. Biến môi trường (Variables)

| Biến | Ghi chú |
|------|---------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Supabase pooler — xem `backend/SUPABASE-CAU-HINH.txt` |
| `Jwt__Key` hoặc `JWT_KEY` | ≥ 32 ký tự |
| `Frontend__PublicBaseUrl` | `https://yumegoji.vercel.app` |
| `Gemini__ApiKey` | (tuỳ chọn) |

**Không dùng:** Azure SQL, SQL Server, `MSSQL_*`, Docker Postgres local.

### Connection string mẫu

```
Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jvdghkjkgrdogpymnwpu;Password=MAT_KHAU_THAT;SSL Mode=Require
```

Password có `@` / `!` → bọc `Password="..."`. Sau khi sửa biến → **Deploy** lại.

## 3. Vercel (frontend)

```
VITE_API_URL=https://japanese-learning-chat-website-exe201-production.up.railway.app
```

Rồi **Redeploy** frontend.

## 4. Local

```powershell
cd backend
# Tạo appsettings.Secrets.json từ example — mật khẩu Supabase thật
dotnet run --launch-profile http
```

API: http://localhost:5056/swagger

## 5. Kiểm tra

- `GET /health` → 200
- Login admin trên Vercel không còn 503 / 28P01

## 6. Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| **28P01** password authentication failed | Sai mật khẩu trong `ConnectionStrings__DefaultConnection` / `DATABASE_URL` |
| **502** | Crash lúc start — xem Deploy logs |
| Login OK local, fail Vercel | Railway chưa Redeploy hoặc env sai |
