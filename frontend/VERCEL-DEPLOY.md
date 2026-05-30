# Deploy frontend lên Vercel — checklist

## Vì sao nút Đăng nhập / Google không chạy?

Vercel **chỉ host React (static)**. Request `/api/Auth/login` tới domain Vercel → **404**  
(vì **không có backend .NET** trên Vercel).

Console lỗi mẫu: `GET .../api/Public/system-announcements/... 404`

Chỉ thêm URL trong **Google Cloud Console** là **chưa đủ** — cần **backend API** chạy ở nơi khác (Railway, Azure, VPS…).

---

## Bước 1 — Deploy backend (.NET 8)

Ví dụ Railway (repo có `Dockerfile` + `railway.toml`):

1. Tạo project Railway → Deploy from GitHub
2. Thêm **SQL Server** (Azure SQL / container) — connection string
3. Biến môi trường backend:
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key` (chuỗi mạnh ≥ 32 ký tự)
   - `GoogleAuth__ClientId` = cùng Client ID Web trên Google Console
   - `Frontend__PublicBaseUrl` = `https://japanese-learning-chat-website-exe.vercel.app`
   - `Gemini__ApiKey` (nếu dùng AI)

4. Lấy URL public API, ví dụ: `https://yumegoji-api-production.up.railway.app`

---

## Bước 2 — Biến môi trường trên Vercel

Project Vercel → **Settings → Environment Variables** (Production):

| Biến | Ví dụ |
|------|--------|
| `VITE_API_URL` | `https://yumegoji-api-production.up.railway.app` |
| `VITE_GOOGLE_CLIENT_ID` | `638842872923-....apps.googleusercontent.com` |

**Quan trọng:** Sau khi thêm/sửa biến → **Redeploy** (Deployments → Redeploy).

`VITE_*` được nhúng lúc **build** — sửa env mà không redeploy thì không có tác dụng.

---

## Bước 3 — Google Cloud Console

**Authorized JavaScript origins** (đã có):

- `https://japanese-learning-chat-website-exe.vercel.app`
- `http://localhost:8080` (dev)

**Authorized redirect URIs** (GIS thường không bắt buộc redirect riêng, nhưng nên có):

- `https://japanese-learning-chat-website-exe.vercel.app`
- `http://localhost:8080`

Client ID phải **trùng** `VITE_GOOGLE_CLIENT_ID` (FE) và `GoogleAuth:ClientId` (BE).

---

## Bước 4 — Kiểm tra

1. Mở: `https://YOUR-BACKEND-URL/swagger` — API sống
2. Mở DevTools → Network → bấm **Đăng nhập**
3. Request phải tới `https://YOUR-BACKEND-URL/api/Auth/login`  
   **Không** phải `...vercel.app/api/...`

---

## Tóm tắt

| Việc | Google Console URL | Đủ để login? |
|------|-------------------|--------------|
| Thêm origin Vercel | ✅ | ❌ (chỉ cho popup Google) |
| `VITE_API_URL` + backend deploy | — | ✅ |
