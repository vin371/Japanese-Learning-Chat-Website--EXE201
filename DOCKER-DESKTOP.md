# Hướng dẫn Docker Desktop cho dự án Yumegoji / EXE201

## 1. Một số khái niệm nhanh

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **Image** | Bản “cài đặt” sẵn (vd PostgreSQL 16) — tải về chỉ là **chưa chạy** database. |
| **Container** | Một **PostgreSQL đang chạy** tạo ra từ image — ứng dụng kết nối vào **container**, không kết nối vào image. |
| **Volume** | Ổ dữ liệu để **Postgres trong container không mất** khi tắt container (vd `yumegoji_pg_data`). |

---

## 2. Cách khuyến nghị: `docker compose` (một lệnh — Postgres + init DB + API)

Mở **PowerShell** hoặc **Terminal**:

```powershell
cd E:\EXE201\Japanese-Learning-Chat-Website--EXE201\Japanese-Learning-Chat-Website--EXE201
copy .env.example .env   # tuỳ chọn — có giá trị mặc định
docker compose up -d --build
```

Compose sẽ tự:

1. Khởi động **PostgreSQL 16** (`yumegoji-postgres`, cổng host `5433`)
2. Chạy **db-init** — chờ Postgres healthy rồi tự chạy `yumegoji_supabase.sql` + seed part01–13 + indexes + FK (bỏ qua nếu đã có `users`)
3. Build và chạy **API** (`yumegoji-api`) — Swagger: `http://localhost:5056/swagger`

- `-d` = chạy nền (Docker Desktop → tab **Containers**).
- Volume `yumegoji_pg_data` giữ dữ liệu Postgres; `yumegoji_uploads` giữ file upload API.

**Dừng container** (giữ volume / giữ data):

```powershell
docker compose down
```

**Xóa cả dữ liệu Postgres** (chạy lại init từ đầu):

```powershell
docker compose down -v
docker compose up -d --build
```

**Xem log:**

```powershell
docker compose logs -f postgres
docker compose logs db-init
docker compose logs -f api
```

Lần đầu có thể mất **2–5 phút** (tải image Postgres + build API + chạy seed).

---

## 3. Kết nối bằng pgAdmin / DBeaver / psql

| Trường | Giá trị |
|--------|---------|
| Host | `localhost` |
| Port | `5433` |
| Database | `yumegoji` |
| Username | `yumegoji` |
| Password | Trùng với `POSTGRES_PASSWORD` trong `.env` (mặc định: `Yumegoji_Pg_2024!`) |

**Không cần chạy script SQL thủ công** nếu đã dùng `docker compose up` — service `db-init` tự init.

Chỉ chạy tay khi bạn **không** dùng Compose hoặc muốn seed lại — xem thứ tự trong [README.md](README.md) mục “Khởi tạo schema + dữ liệu mẫu”.

---

## 4. Backend .NET với Postgres Docker

### A. Chạy API trong Docker (khuyến nghị cùng Compose)

Sau `docker compose up -d --build`:

- API: `http://localhost:5056/swagger`
- Frontend dev (máy host): đặt `VITE_PROXY_TARGET=http://localhost:5056` trong `frontend/.env`

### B. Chạy API trên máy host (`dotnet run`)

- `backend\appsettings.Docker.json` — `Host=localhost;Port=5433` khi Postgres chạy trong Docker
- Profile **`Docker`** trong `launchSettings.json`

```powershell
cd backend
dotnet run --launch-profile Docker
```

Nếu đổi mật khẩu trong `.env` / Compose, sửa **cùng** mật khẩu trong `appsettings.Docker.json`.

---

## 5. Supabase cloud vs Docker local

| | **Supabase** | **Docker Postgres** |
|---|-------------|---------------------|
| Host | `*.pooler.supabase.com` | `localhost:5433` |
| DB | `postgres` | `yumegoji` |
| Cấu hình | `appsettings.Secrets.json` | profile Docker / Compose |
| SSL | Bắt buộc (`SSL Mode=Require`) | Không cần (local) |

Hai môi trường **độc lập** — chọn một connection string khi chạy backend.

Chi tiết Supabase: **`backend/SUPABASE-CAU-HINH.txt`**.

---

## 6. Gỡ rối nhanh

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| Container **Exited** ngay sau Run | Xem **Logs**: cổng bận, thiếu biến môi trường. |
| Không kết nối được `localhost:5433` | Kiểm tra container **Running**; đúng cổng **5433**. |
| `db-init` failed | Xem `docker compose logs db-init` — thường do seed chạy lại trên DB đã có data (dùng `down -v` để reset). |
| API 500 khi dùng Supabase | Kiểm tra Session pooler, mật khẩu trong Secrets — xem `SUPABASE-CAU-HINH.txt`. |
| Cổng 5056 bận | `cd backend; .\stop-backend.ps1` |

---

*Tài liệu tổng quan: [README.md](README.md).*
