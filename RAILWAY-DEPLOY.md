# Deploy backend lên Railway — DB = Supabase

## Log này nghĩa là gì?

```
không thấy ConnectionStrings__DefaultConnection / DATABASE_URL
PasswordLen=25; UsingPlaceholderPassword=True
```

`PasswordLen=25` = đang dùng chữ `YOUR_SUPABASE_DB_PASSWORD` trong `appsettings.json`.  
→ **Container không nhận biến** (dù UI Variables có hiện). Không phải sai mật khẩu `Yumegoji899`.

## Sửa nhanh (làm đúng từng bước)

1. Railway → mở **đúng service** API đang Online (không nhầm project khác).
2. **Variables** → **xóa** `DATABASE_URL` nếu có.
3. Thêm / sửa biến **trên service** (Shared Variables phải được **Share** vào service này):

| Name | Value |
|------|--------|
| `ConnectionStrings__DefaultConnection` | xem bên dưới |
| hoặc chỉ `SUPABASE_DB_PASSWORD` | mật khẩu Database Supabase |

```
Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jvdghkjkgrdogpymnwpu;Password=MAT_KHAU;SSL Mode=Require
```

4. Biến phải bật **Runtime** (không chỉ Build).
5. Save → **Deploy** / Redeploy → chờ **Active**.
6. Xem log lúc start phải có:

```
[yumegoji] Env DB/JWT keys: ConnectionStrings__DefaultConnection, JWT_KEY, ...
[yumegoji] DB từ env=ConnectionStrings__DefaultConnection; PasswordLen=11
Đã kết nối PostgreSQL (Supabase) thành công.
```

Nếu log vẫn `(không có key nào)` → biến chưa gắn service / chưa Redeploy.

7. Kiểm tra: `https://<railway-url>/health` → `"placeholder": false`

## Tên biến đúng (2 dấu `_`)

| Đúng | Sai |
|------|-----|
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings_DefaultConnection` |
| `Frontend__PublicBaseUrl` | `Frontend_PublicBaseUrl` |
| `Gemini__ApiKey` | `Gemini_ApiKey` |
| `GoogleAuth__ClientId` | `GoogleAuth_ClientId` |

## Vercel

`VITE_API_URL` = URL Railway đúng service (có `-71ba` nếu đó là URL hiện tại).
