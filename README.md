# PerpusApp — Vercel API

Proxy aman antara Electron Launcher dan GitHub private repo.

## Setup di Vercel

1. Push folder `vercel-api/` ke repo GitHub terpisah (atau subfolder)
2. Connect ke Vercel → New Project
3. Set **Environment Variables** di Vercel Dashboard:

| Key                  | Value                              | Keterangan                              |
|----------------------|------------------------------------|-----------------------------------------|
| `LAUNCHER_SECRET_KEY`| `buat-sendiri-string-acak-panjang` | Secret yang sama disimpan di launcher   |
| `GITHUB_TOKEN`       | `ghp_xxx...` (token akun **bot**)  | Token akun bot, kolaborator repo private|
| `GITHUB_USER`        | `mughitsFM`                        | Username akun utama pemilik repo        |
| `GITHUB_REPO`        | `Web_Perpus_APP`                   | Nama repo private                       |

4. Deploy → Vercel beri URL seperti `https://perpusapp-api.vercel.app`

## Endpoint

### `POST /api/check-update`

**Header:**
```
x-secret-key: <LAUNCHER_SECRET_KEY>
Content-Type: application/json
```

**Response sukses (200):**
```json
{
  "version": "1.1.0",
  "updated_at": "2026-05-28",
  "notes": "Perbaikan bug halaman pinjam",
  "changes": { "frontend": true, "backend": false },
  "downloadToken": "ghp_xxx...",
  "repoZipUrl": "https://github.com/xxx/yyy/archive/refs/heads/main.zip"
}
```

**Response error:**
- `401` — secret key salah
- `502` — gagal konek ke GitHub
- `500` — env vars belum dikonfigurasi

## Keamanan

- `GITHUB_TOKEN` tidak pernah hardcode di Electron app
- Launcher hanya perlu tahu `LAUNCHER_SECRET_KEY` yang scope-nya terbatas
- Jika launcher dicompromise, attacker hanya bisa cek versi & download ZIP — tidak bisa push/delete repo
