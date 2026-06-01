# Deploy backend lên Railway (YumeGo-ji)

## 1. Cấu hình service trên Railway

- **Root directory:** repo gốc (có `Dockerfile`, `railway.toml`)
- **Builder:** Dockerfile (`railway.toml` đã cấu hình)
- **Port:** Railway tự gán `PORT` — không cần `API_HOST_PORT`

## 2. Biến môi trường (Variables)

| Biến | Ví dụ / ghi chú |
|------|------------------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Session pooler Supabase (xem `backend/SUPABASE-CAU-HINH.txt`) |
| `Jwt__Key` hoặc `JWT_KEY` | Chuỗi bí mật JWT mạnh (≥ 32 ký tự) |
| `Frontend__PublicBaseUrl` | `https://yumegoji.vercel.app` |
| `Gemini__ApiKey` | (tuỳ chọn) Google AI |

**Không dùng:** `MSSQL_SA_PASSWORD`, `API_HOST_PORT` (cấu hình Docker/SQL Server cũ).

### Connection string mẫu (pooler IPv4)

```
Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jvdghkjkgrdogpymnwpu;Password="MAT_KHAU_THAT";SSL Mode=Require;Trust Server Certificate=true
```

Mật khẩu có ký tự `@` hoặc `!` → **bọc trong dấu ngoặc kép** quanh `Password="..."`.

**Sau khi sửa biến trên Railway → bấm nút tím Deploy** (góc trên). Chỉ Save chưa đủ — phải thấy "1 Change" biến mất và deployment mới chạy.

Lấy host/username từ Supabase → **Connect** → **Session pooler**.

## 3. Vercel (frontend)

```
VITE_API_URL=https://japanese-learning-chat-website-exe201-production.up.railway.app
```

Sau khi đổi biến → **Redeploy** frontend.

## 4. Chạy local

```powershell
cd backend
.\run-backend.ps1
```

Hoặc nếu `dotnet run` báo **file locked by backend.exe**:

```powershell
.\stop-backend.ps1
dotnet run --launch-profile http
```

API: http://localhost:5056 — Swagger: http://localhost:5056/swagger

File mật khẩu DB: `backend/appsettings.Secrets.json` (copy từ `appsettings.Secrets.example.json`).

## 5. Kiểm tra sau deploy

- `GET https://<railway-url>/` → `200` (JSON API info — không còn 404 trình duyệt)
- `GET https://<railway-url>/health` → `200` (healthcheck Railway)
- `GET https://<railway-url>/api/Public/health` → `200` `{ "status": "ok" }`
- Đăng nhập admin trên Vercel → `/admin` không còn 500

## 6. Vercel — bắt buộc Redeploy sau khi đổi biến

`VITE_API_URL` = `https://japanese-learning-chat-website-exe201-production.up.railway.app` (không slash cuối)

Sau khi sửa biến trên Vercel → **Deployments → Redeploy** (build cũ vẫn trỏ URL sai).

## 7. Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| **502 Application failed to respond** | App chưa lắng nghe `PORT` / crash lúc start / **chưa Deploy** sau khi sửa Variables |
| **404** trên `/` (cũ) | API không có route gốc — dùng `/health` hoặc pull commit có `GET /` |
| CORS trên Vercel | Backend 500, không phải thiếu CORS — sửa `/api/Admin/overview` |
| Local OK, Vercel 500 | Railway chưa deploy commit mới hoặc `ASPNETCORE_ENVIRONMENT` ≠ Production |
| Login OK, overview 500 | Đã fix: Production dùng EF cho admin overview (commit v4 cache) |
