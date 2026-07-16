# Deploy backend lên Railway (YumeGo-ji) — DB = Supabase

## 1. Cấu hình service

- **Root directory:** để **trống**
- **Builder:** Dockerfile (chỉ đóng gói API; DB = Supabase)
- Chờ Deployments → **Active** (không còn Building) rồi mới test login

## 2. Biến môi trường — đúng tên (2 dấu `_`)

| Đúng | Sai (không nhận) |
|------|------------------|
| `ConnectionStrings__DefaultConnection` | |
| `Frontend__PublicBaseUrl` | `Frontend_PublicBaseUrl` |
| `Gemini__ApiKey` | `Gemini_ApiKey` |
| `GoogleAuth__ClientId` | `GoogleAuth_ClientId` |
| `Jwt__Key` hoặc `JWT_KEY` | |
| `ASPNETCORE_ENVIRONMENT` = `Production` | |

### Connection string (copy đúng)

```
Host=aws-1-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jvdghkjkgrdogpymnwpu;Password=MAT_KHAU_SUPABASE;SSL Mode=Require
```

- `MAT_KHAU_SUPABASE` = mật khẩu **Database** trong Supabase → Project Settings → Database (không phải mật khẩu đăng nhập dashboard).
- **Xóa biến `DATABASE_URL`** nếu còn (dễ giữ mật khẩu cũ, gây 28P01).
- Sau khi Save → bấm **Deploy** lại.

## 3. Kiểm tra sau deploy

Mở: `https://<railway-url>/health`

JSON phải có:

```json
"db": { "host": "aws-1-ap-southeast-2.pooler.supabase.com", "username": "postgres.jvdghkjkgrdogpymnwpu", "passwordLen": ..., "placeholder": false }
```

Log Railway lúc start:

```
[yumegoji] DB từ env=ConnectionStrings__DefaultConnection; Host=aws-1-...; User=postgres.jvdghkjkgrdogpymnwpu; PasswordLen=...
Đã kết nối PostgreSQL (Supabase) thành công.
```

Nếu vẫn `28P01`: Reset Database password trên Supabase → dán mật khẩu mới vào `ConnectionStrings__DefaultConnection` → Redeploy.

## 4. Vercel

```
VITE_API_URL=https://japanese-learning-chat-website-exe201-production-71ba.up.railway.app
```

(URL đúng service đang Online — Redeploy frontend sau khi đổi.)
