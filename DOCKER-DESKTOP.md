# Hướng dẫn Docker Desktop cho dự án Yumegoji / EXE201

## 1. Một số khái niệm nhanh

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **Image** | Bản “cài đặt” sẵn (vd SQL Server 2022) — tải về chỉ là **chưa chạy** database. |
| **Container** | Một **máy SQL đang chạy** tạo ra từ image — ứng dụng kết nối vào **container**, không kết nối vào image. |
| **Volume** | Ổ dữ liệu để **SQL trong container không mất** khi tắt container (vd `exe201_yumegoji_mssql_data`). |

Bạn thấy image `mcr.microsoft.com/mssql/server:2022-latest` trong tab **Images** = đã sẵn sàng; cần **tạo container** (hoặc dùng Compose) thì SQL mới lắng nghe cổng.

---

## 2. Cách khuyến nghị: `docker compose` (một lệnh — SQL + init DB + API)

Mở **PowerShell** hoặc **Terminal**:

```powershell
cd D:\semester 8\EXE2\Yumegoji-EXE201
copy .env.example .env   # tuỳ chọn — có giá trị mặc định
docker compose up -d --build
```

Compose sẽ tự:

1. Khởi động **SQL Server** (`yumegoji-sql`, cổng host `14333`)
2. Chạy **db-init** — chờ SQL healthy rồi tự chạy `01_yumegoji_database_DDL.sql` + `02_yumegoji_database_seed.sql` (bỏ qua nếu `YumegojiDB` đã có)
3. Build và chạy **API** (`yumegoji-api`) — Swagger: `http://localhost:5056/swagger`

- `-d` = chạy nền (Docker Desktop → tab **Containers**).
- Volume `yumegoji_mssql_data` giữ dữ liệu SQL; `yumegoji_uploads` giữ file upload API.

**Dừng container** (giữ volume / giữ data):

```powershell
docker compose down
```

**Xóa cả dữ liệu SQL** (chạy lại init từ đầu):

```powershell
docker compose down -v
docker compose up -d --build
```

**Xem log:**

```powershell
docker compose logs -f sqlserver
docker compose logs db-init
docker compose logs -f api
```

Lần đầu có thể mất **1–3 phút** (tải image SQL + build API + chạy script DDL/seed).

---

## 3. Cách bấm **Run** từ tab Images (nếu không dùng Compose)

Khi mở **Run a new container** từ image SQL Server:

1. **Container name** (tên container — *không* phải tên database):
   - Có thể đặt: `yumegoji-sql` hoặc `yumegoji-db`  
   - **YumegojiDB** là tên **database** bên trong SQL; tạo bằng script SQL, không bắt buộc trùng tên container.

2. **Ports — Host port:** nhập **`14333`**  
   - Bên phải giữ **`1433`** (cổng trong container).  
   - Kết nối từ Windows: `localhost,14333`.

3. **Environment variables** — thêm **2 dòng** (bắt buộc):

   | Variable | Value |
   |----------|--------|
   | `ACCEPT_EULA` | `Y` |
   | `MSSQL_SA_PASSWORD` | Mật khẩu **mạnh** (vd `Yumegoji_Sql_2024!`) |

   Image SQL trên Linux **thường từ chối** mật khẩu quá yếu như `12345` → container sẽ **tự thoát**.

4. Bấm **Run** → sang tab **Containers** kiểm tra trạng thái **Running** (xanh).

**Lưu ý:** Nếu đã dùng `docker compose` trước đó, không cần Run thủ công thêm một container thứ hai trừ khi bạn biết rõ (hai container cùng map `14333` sẽ lỗi cổng).

---

## 4. Kết nối bằng SSMS / Azure Data Studio

| Trường | Giá trị |
|--------|---------|
| Server | `localhost,14333` |
| Xác thực | SQL Server Authentication |
| Login | `sa` |
| Password | Trùng với `MSSQL_SA_PASSWORD` trong `.env` / Compose (mặc định: `Yumegoji_Sql_2024!`) |

**Không cần chạy script SQL thủ công** nếu đã dùng `docker compose up` — service `db-init` tự chạy `01` + `02`.

Chỉ chạy tay khi bạn **không** dùng Compose hoặc muốn seed lại:

1. `backend\doc\sql\01_yumegoji_database_DDL.sql`
2. `backend\doc\sql\02_yumegoji_database_seed.sql`

**SSMS:** Query → **SQLCMD Mode** (vì file dùng lệnh `:r` để gọi script con), mở từng file và **Execute**. Hoặc dùng **`sqlcmd`** từ PowerShell — xem [README.md](README.md) mục “Khởi tạo schema + dữ liệu mẫu”.

File `YumegojiDB-AllScripts.sql` chỉ còn **tham khảo / snapshot cũ**; luồng mới dùng `01` + `02`.

---

## 5. Backend .NET với SQL Docker

### A. Chạy API trong Docker (khuyến nghị cùng Compose)

Sau `docker compose up -d --build`:

- API: `http://localhost:5056/swagger`
- Frontend dev (máy host): đặt `VITE_PROXY_TARGET=http://localhost:5056` trong `frontend/.env`

### B. Chạy API trên máy host (dotnet run)

- `backend\appsettings.Docker.json` — `Server=localhost,14333` khi SQL chạy trong Docker
- Profile **`Docker`** trong `launchSettings.json`

```powershell
cd backend
dotnet run --launch-profile Docker
```

Nếu đổi mật khẩu trong `.env` / Compose, sửa **cùng** mật khẩu trong `appsettings.Docker.json` (hoặc dùng biến môi trường `ConnectionStrings__DefaultConnection`).

---

## 6. Khác với SQL Server trên Windows (`LAPTOP-...\VINH`)

- **Windows SQL:** `Server=LAPTOP-EF9AH3K8\VINH`, `sa` / `12345` (trong `appsettings.json` khi chạy Development).
- **Docker SQL:** `Server=localhost,14333`, `sa` / mật khẩu container (không nhất thiết là `12345`).

Hai cái **song song được**; chỉ cần đúng **chuỗi kết nối** khi chạy backend.

---

## 7. Gỡ rối nhanh

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| Container **Exited** ngay sau Run | Xem **Logs**: thiếu `ACCEPT_EULA`, mật khẩu yếu, hoặc cổng bận. |
| Không kết nối được `localhost,14333` | Kiểm tra container đang **Running**; host port đúng **14333**. |
| `docker compose up` báo cổng đã dùng | Đổi trong `docker-compose.yml` thành `"14334:1433"` và sửa connection string + SSMS cho khớp. |

---

*Tài liệu tổng quan chạy dự án: [README.md](README.md).*
