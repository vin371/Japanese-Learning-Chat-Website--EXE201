# Yumegoji / EXE201

Nền tảng học tiếng Nhật: backend **ASP.NET Core 8** (API + SignalR), frontend **React + Vite**, cơ sở dữ liệu **Supabase (PostgreSQL)**.

## Yêu cầu môi trường

| Thành phần | Phiên bản / ghi chú |
|------------|---------------------|
| [.NET SDK](https://dotnet.microsoft.com/download/dotnet/8.0) | **8.0** |
| [Node.js](https://nodejs.org/) | **18+** (khuyến nghị LTS) |
| [Supabase](https://supabase.com/) | PostgreSQL cloud — **khuyến nghị cho dev/production** |
| (Tuỳ chọn) [Ollama](https://ollama.com/) | Import bài học bằng AI khi không dùng OpenAI |
| (Tuỳ chọn) [Docker Desktop](https://www.docker.com/products/docker-desktop/) | PostgreSQL local trong container — chi tiết **[DOCKER-DESKTOP.md](DOCKER-DESKTOP.md)** |

## Cấu trúc thư mục

```
EXE201/
├── backend/                 # API .NET (Swagger, JWT, upload PDF/DOCX/PPTX)
├── frontend/                # React + Vite (dev: cổng 8080)
├── docker-compose.yml       # PostgreSQL 16 + init seed + API (host 5433 / 5056)
├── Dockerfile               # Image chạy API (không chứa DB)
├── backend/doc/sql/         # Schema + seed Supabase — xem mục “Cơ sở dữ liệu”
├── DOCKER-DESKTOP.md        # Docker Desktop + pgAdmin + cổng 5433
└── README.md
```

## 1. Cơ sở dữ liệu (Supabase / PostgreSQL)

Backend dùng **Npgsql** (PostgreSQL). Không còn dùng SQL Server cho luồng chính.

### Bạn đang dùng kiểu nào?

| Kiểu | Khi nào cần chạy script SQL |
|------|------------------------------|
| **Supabase cloud** (khuyến nghị) | DB **mới / trống** hoặc sau khi đổi schema — xem thứ tự script bên dưới. |
| **PostgreSQL trong Docker** (`localhost:5433`) | Sau **lần đầu** `docker compose up` (hoặc sau `docker compose down -v`) — service `db-init` tự chạy schema + seed. |

**Lưu ý:** Supabase cloud và PostgreSQL Docker local là **hai máy chủ khác nhau** — connection string phải trỏ đúng cái bạn đang dùng.

### Chuỗi kết nối backend

**Supabase (dev trên máy):** tạo **`backend/appsettings.Secrets.json`** (đã `.gitignore`) — xem chi tiết **`backend/SUPABASE-CAU-HINH.txt`**.

Trên Windows, dùng **Session pooler** (IPv4), không dùng host `db.*.supabase.co` trực tiếp:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<PROJECT_REF>;Password=MAT_KHAU;SSL Mode=Require;Trust Server Certificate=true"
}
```

**Docker local** (profile `Docker` + **`appsettings.Docker.json`**):

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5433;Database=yumegoji;Username=yumegoji;Password=Yumegoji_Pg_2024!"
}
```

**Lưu ý bảo mật:** Không commit mật khẩu Supabase lên Git. Dùng `appsettings.Secrets.json`, User Secrets, hoặc biến môi trường `ConnectionStrings__DefaultConnection` khi deploy (Railway, Vercel backend, …).

### Khởi tạo schema + dữ liệu mẫu (Supabase SQL Editor hoặc `psql`)

Trong `backend/doc/sql/`:

| Thứ tự | File | Nội dung |
|--------|------|----------|
| 1 | **`yumegoji_supabase.sql`** | Schema (100 bảng, extension, FK gốc). |
| 2 | **`yumegoji_supabase_data_v2_parts/part01` → `part13`** | Dữ liệu mẫu (game, câu hỏi, lesson, admin bcrypt, …). |
| 3 | **`yumegoji_supabase_indexes.sql`** | Index bổ sung (tuỳ chọn, khuyến nghị). |
| 4 | **`yumegoji_supabase_missing_fks.sql`** | FK còn thiếu + sửa orphan (idempotent). |

**Supabase Dashboard:** SQL Editor → mở từng file → **Run** (mỗi part = một lần Run).

**psql** (Docker local, đổi mật khẩu cho khớp `.env`):

```powershell
cd backend\doc\sql
$env:PGPASSWORD = "Yumegoji_Pg_2024!"
psql -h localhost -p 5433 -U yumegoji -d yumegoji -f yumegoji_supabase.sql
Get-ChildItem yumegoji_supabase_data_v2_parts\yumegoji_supabase_data_v2_part*.sql | Sort-Object Name | ForEach-Object {
  psql -h localhost -p 5433 -U yumegoji -d yumegoji -f $_.FullName
}
psql -h localhost -p 5433 -U yumegoji -d yumegoji -f yumegoji_supabase_indexes.sql
psql -h localhost -p 5433 -U yumegoji -d yumegoji -f yumegoji_supabase_missing_fks.sql
```

- **`yumegoji_supabase_data_v2_fixed.sql`:** bản gộp seed (thay cho part01–13 nếu tiện).
- Script **`01_yumegoji_database_DDL.sql` / `02_yumegoji_database_seed.sql`:** luồng **SQL Server cũ**, chỉ tham khảo legacy.

### PostgreSQL bằng Docker (tuỳ chọn)

- **Container:** `yumegoji-postgres` — cổng host **`5433`**, DB **`yumegoji`**, user **`yumegoji`**.
- Mật khẩu: `POSTGRES_PASSWORD` trong **`.env`** (mặc định `Yumegoji_Pg_2024!`).

```bash
docker compose up -d --build
```

Compose tự: khởi động Postgres → `db-init` chạy schema + seed → build/chạy API.

- API Swagger: **http://localhost:5056/swagger**
- Chạy API trên máy host (không container):

  ```bash
  cd backend
  dotnet run --launch-profile Docker
  ```

## 2. Chạy backend (API)

```bash
cd backend
dotnet restore
dotnet run
```

- Profile mặc định (HTTP): **http://localhost:5056**
- Swagger: **http://localhost:5056/swagger**
- Nếu cổng bận: `.\stop-backend.ps1` rồi chạy lại.

Cổng có thể khác nếu bạn đổi trong `Properties/launchSettings.json`.

## 3. Chạy frontend (React)

```bash
cd frontend
npm install
npm run dev
```

- Mã nguồn trong **`frontend/src/`**: `api/`, `services/`, `layout/`, `ui/`, `components/`, `pages/`, `context/`, `hooks/`, `routes/`, …
- Ứng dụng web: **http://localhost:8080**
- Vite proxy chuyển `/api` và `/hubs` sang backend (mặc định `http://localhost:5056` — xem `vite.config.js`, biến `VITE_PROXY_TARGET`).

**Khuyến nghị:** Sao chép `.env.example` → `.env`. Để **trống** `VITE_API_URL` khi dev để mọi request đi qua proxy (tránh lỗi CORS / sai cổng).

## 4. AI import bài học (Moderator)

- **OpenAI:** đặt `OpenAI:ApiKey` trong cấu hình (xem `backend/OPENAI-CAU-HINH.txt`).
- **Ollama (local):** `ollama serve`, `ollama pull llama3.2`. Trong `appsettings.json`: `Ollama:BaseUrl`, `LessonImport:Provider` (`auto` / `openai` / `ollama`).

Upload PDF/DOCX/PPTX có thể mất vài phút — frontend đã cấu hình timeout proxy dài cho import.

## 5. Build production (tham khảo)

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
dotnet publish -c Release -o ./publish
```

Triển khai: **Frontend** [Vercel](https://yumegoji-exe-201.vercel.app) — set `VITE_API_URL`. **Backend** Railway hoặc tương đương — set `ConnectionStrings__DefaultConnection` (Supabase pooler), `Jwt__Key`, HTTPS.

## 6. Script SQL (`backend/doc/sql/`)

| Luồng | Mô tả |
|-------|--------|
| **Supabase (hiện tại)** | `yumegoji_supabase.sql` → part01–13 → indexes → `missing_fks.sql` |
| **SQL Server (legacy)** | `01_yumegoji_database_DDL.sql` → `02_yumegoji_database_seed.sql` |

Patch lẻ (`patch_*`, `seed_*`) dùng khi cần sửa từng phần trên DB đã có.

## Liên kết

- Repository: [vinhhntse180198/Yumegoji-EXE201](https://github.com/vinhhntse180198/Yumegoji-EXE201)

---

*Nếu lỗi kết nối API: kiểm tra backend đang chạy, Supabase pooler trong Secrets, `VITE_PROXY_TARGET` / `VITE_API_URL`. Lỗi IPv6 với `db.*.supabase.co` → dùng Session pooler (xem `SUPABASE-CAU-HINH.txt`).*
