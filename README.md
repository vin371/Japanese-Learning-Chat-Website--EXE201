# Yumegoji / EXE201

Nền tảng học tiếng Nhật: backend **ASP.NET Core 8** (API + SignalR), frontend **React + Vite**, cơ sở dữ liệu **Supabase (PostgreSQL)** — không dùng Azure SQL / SQL Server / Docker Postgres local.

## Yêu cầu môi trường

| Thành phần | Phiên bản / ghi chú |
|------------|---------------------|
| [.NET SDK](https://dotnet.microsoft.com/download/dotnet/8.0) | **8.0** |
| [Node.js](https://nodejs.org/) | **18+** (khuyến nghị LTS) |
| [Supabase](https://supabase.com/) | PostgreSQL cloud — **bắt buộc** cho dev & production |
| (Tuỳ chọn) [Ollama](https://ollama.com/) | Import bài học bằng AI khi không dùng Gemini/OpenAI |

## Cấu trúc thư mục

```
EXE201/
├── backend/                 # API .NET (Swagger, JWT, upload)
├── frontend/                # React + Vite (dev: cổng 8080)
├── Dockerfile               # Chỉ đóng gói API cho Railway (DB = Supabase)
├── railway.toml
├── RAILWAY-DEPLOY.md
├── backend/doc/sql/         # Schema + seed Supabase
├── backend/SUPABASE-CAU-HINH.txt
└── README.md
```

## 1. Cơ sở dữ liệu — chỉ Supabase

Backend dùng **Npgsql** → **Supabase Session pooler**. Chi tiết: **`backend/SUPABASE-CAU-HINH.txt`**.

### Chuỗi kết nối (local)

Tạo **`backend/appsettings.Secrets.json`** (đã `.gitignore`) từ `appsettings.Secrets.example.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<PROJECT_REF>;Password=MAT_KHAU;SSL Mode=Require"
}
```

Trên Windows dùng **Session pooler** (IPv4), không dùng `db.*.supabase.co` trực tiếp.

### Khởi tạo schema + seed (Supabase SQL Editor)

Trong `backend/doc/sql/`:

| Thứ tự | File |
|--------|------|
| 1 | `yumegoji_supabase.sql` |
| 2 | `yumegoji_supabase_data_v2_parts/part01` → `part13` |
| 3 | `yumegoji_supabase_indexes.sql` (tuỳ chọn) |
| 4 | `yumegoji_supabase_missing_fks.sql` |

## 2. Chạy backend (API)

```bash
cd backend
dotnet restore
dotnet run --launch-profile http
```

- API: **http://localhost:5056**
- Swagger: **http://localhost:5056/swagger**

## 3. Chạy frontend (React)

```bash
cd frontend
npm install
npm run dev
```

- Web: **http://localhost:8080**
- Dev: để trống `VITE_API_URL` để Vite proxy `/api` → backend `:5056`

## 4. Deploy

| Phần | Nơi | Cấu hình |
|------|-----|----------|
| Frontend | [Vercel](https://yumegoji.vercel.app) | `VITE_API_URL` = URL Railway |
| Backend | Railway | `ConnectionStrings__DefaultConnection` (Supabase), `Jwt__Key` |

Xem **[RAILWAY-DEPLOY.md](RAILWAY-DEPLOY.md)** và **[frontend/VERCEL-DEPLOY.md](frontend/VERCEL-DEPLOY.md)**.

## 5. Import DOCX / AI

```powershell
cd backend
dotnet run --no-launch-profile -- import-n5-docx
dotnet run --no-launch-profile -- import-n4-docx
dotnet run --no-launch-profile -- import-n3-docx
```

Thêm `--dry-run` để thử. AI: `Gemini__ApiKey` hoặc Ollama local.

## Liên kết

- Supabase: `backend/SUPABASE-CAU-HINH.txt`
- Railway: `RAILWAY-DEPLOY.md`
- Vercel: `frontend/VERCEL-DEPLOY.md`
