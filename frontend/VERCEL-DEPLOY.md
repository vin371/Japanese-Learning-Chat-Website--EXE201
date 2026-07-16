# Deploy frontend lên Vercel — checklist

## Vì sao login không chạy?

Vercel **chỉ host React**. Request `/api/...` trên domain Vercel → **404**.
Cần backend .NET trên **Railway** + `VITE_API_URL` trỏ đúng.

---

## Bước 1 — Backend (Railway + Supabase)

1. Deploy repo lên Railway (xem `RAILWAY-DEPLOY.md`)
2. Biến môi trường:
   - `ConnectionStrings__DefaultConnection` = **Supabase** Session pooler (không Azure / SQL Server)
   - `Jwt__Key`
   - `GoogleAuth__ClientId`
   - `Frontend__PublicBaseUrl` = URL Vercel
3. Lấy URL API, ví dụ: `https://....up.railway.app`

---

## Bước 2 — Vercel Environment Variables

| Biến | Ví dụ |
|------|--------|
| `VITE_API_URL` | `https://....up.railway.app` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google Web |

Sau khi sửa → **Redeploy**.

---

## Bước 3 — Google Cloud Console

Authorized JavaScript origins:

- `https://yumegoji.vercel.app` (hoặc domain Vercel của bạn)
- `http://localhost:8080`

---

## Bước 4 — Kiểm tra

1. `https://YOUR-BACKEND-URL/swagger`
2. DevTools → Network → Đăng nhập → request tới `YOUR-BACKEND-URL/api/Auth/login` (không phải vercel.app)
