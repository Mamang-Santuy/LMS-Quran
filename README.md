# LMS Bimbel Al-Qur'an (Google Sheets + Apps Script)

## Struktur Project

```
/frontend
  app.js
  login.html
  dashboard.html
  guru.html
  admin.html
  sayid.html
/backend
  Code.gs
  auth.gs
  api.gs
  database.gs
/styles
  tailwind.css
```

## 1) Setup Google Sheets (Database)
Buat Spreadsheet dengan nama sheet dan header berikut:

### USERS
`id | username | password | role | nama | status`

### GURU
`id_guru | nama | no_hp | alamat | status`

### PESERTA_DIDIK
`id_santri | nama | level | guru_id | status`

### KURIKULUM
`id_materi | level | nama_materi | urutan`

### PROGRESS_BELAJAR
`id | tanggal | guru_id | santri_id | materi | catatan`

### REQUEST_UJIAN
`id | santri_id | guru_id | tanggal_request | status`

### HASIL_UJIAN
`id | santri_id | penguji_id | nilai | catatan | tanggal`

### KAFALAH
`id | guru_id | bulan | jumlah | status | tanggal_transfer`

### SESSIONS (tambahan untuk login session)
`token | user_id | role | expires_at | is_active | created_at`

### NOTIFIKASI (opsional)
`id | user_id | jenis | pesan | created_at | status`

## 2) Setup Backend Apps Script
1. Buka Spreadsheet -> Extensions -> Apps Script.
2. Buat file: `Code.gs`, `auth.gs`, `api.gs`, `database.gs`.
3. Copy isi file dari folder `/backend` project ini.

## 3) Deploy jadi Web App
1. Klik `Deploy` -> `New deployment`.
2. Type: `Web app`.
3. Execute as: `Me`.
4. Who has access: sesuaikan kebutuhan (umumnya `Anyone`).
5. Klik `Deploy`, copy URL Web App.

## 4) Setup Frontend
1. Buka file `/frontend/app.js`.
2. Isi:
```js
window.APP_CONFIG = {
  API_BASE_URL: "URL_WEBAPP_ANDA",
};
```
3. Upload folder frontend + styles ke hosting statis (Vercel/Netlify/Firebase Hosting/GitHub Pages).

## 5) API yang tersedia
- `loginUser()`
- `getUserData()`
- `getSantriByGuru()`
- `saveProgress()`
- `requestUjian()`
- `approveUjian()`
- `saveHasilUjian()`
- `getKafalah()`
- `getDashboardStats()`

Tambahan internal untuk halaman admin:
- `getRawRequestUjianForAdmin()`

## 6) Format Request ke Web App
Semua request `POST` JSON:

```json
{
  "action": "loginUser",
  "token": "",
  "payload": {
    "username": "guru1",
    "password": "123456"
  }
}
```

## 7) Catatan Keamanan
- Saat ini password mendukung plaintext dan SHA-256 hash.
- Untuk production, simpan hanya hash password.
- Batasi akses deployment Web App sesuai kebijakan yayasan.

## 8) Halaman Frontend
- `/frontend/login.html`
- `/frontend/dashboard.html`
- `/frontend/guru.html`
- `/frontend/admin.html`
- `/frontend/sayid.html`

Desain sudah mobile-first dengan TailwindCSS dan layout sidebar responsif.
