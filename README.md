# Campus Event Registration Platform

Ini adalah proyek UTS untuk mata kuliah Interoperabilitas.

Proyek ini adalah aplikasi web sederhana menggunakan **FastAPI** untuk backend dan **HTML/JS (Fetch API)** untuk frontend, dengan database **SQLite**.

- Nama Repositori GitHub: `uts-interoperabilitas`

---

## Fitur

- **Backend:** FastAPI, SQLAlchemy (ORM), Pydantic, SQLite.
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API).
- **Halaman Publik (`index.html`):**
  - Menampilkan daftar semua event.
  - Formulir pendaftaran untuk pengunjung.
  - **Modal Detail:** Tombol "View Details" di setiap event untuk menampilkan _pop-up_ berisi daftar peserta yang sudah terdaftar di event tersebut.
- **Halaman Admin (`admin.html`):**
  - Halaman login terpisah untuk admin.
  - Otentikasi menggunakan **JWT (JSON Web Token)**.
  - **Login Persisten:** Admin tetap login bahkan setelah _reload_ halaman (menggunakan `sessionStorage`).
  - Dashboard untuk **Create, Read, Update, Delete (CRUD)** event.
- **Validasi:** Kuota event dicek oleh backend sebelum pendaftaran. Email peserta harus unik.
- **Dokumentasi API:** Dokumentasi Swagger UI dan ReDoc dibuat otomatis oleh FastAPI.

---

## Cara Menjalankan

### 1. Setup Backend (FastAPI)

1.  Buka terminal.
2.  Buat dan aktifkan _virtual environment_:

    ```bash
    # Masuk ke folder backend
    cd backend

    # Buat venv
    python -m venv venv

    # Aktivasi di Windows
    .\venv\Scripts\activate

    # Aktivasi di macOS/Linux
    source venv/bin/activate
    ```

3.  Install semua dependensi Python:
    ```bash
    pip install -r requirements.txt
    ```
4.  **(PENTING - BONUS):** Buka file `backend/auth.py` dan ganti nilai `SECRET_KEY` dengan string acak yang kuat.

5.  **Kembali ke folder root proyek** (`cd ..`), lalu jalankan server `uvicorn` dari sana:

    ```bash
    uvicorn backend.main:app --reload --reload-dir backend
    ```

    - Perintah ini dijalankan dari luar folder `backend` agar _relative imports_ berfungsi.
    - `--reload-dir backend` mencegah _reload_ yang tidak perlu saat `venv` di-scan.

6.  Server backend sekarang berjalan di `http://127.0.0.1:8000`.

### 2. Setup Frontend (HTML/JS)

1.  Pastikan backend sudah berjalan.
2.  Buka file HTML langsung di browser Anda (cukup klik dua kali filenya). Ada dua halaman utama:
    - `frontend/index.html`: Halaman publik untuk melihat event dan mendaftar.
    - `frontend/admin.html`: Halaman admin untuk login dan mengelola event.

---

## Uji Coba API (Swagger)

FastAPI secara otomatis membuatkan dokumentasi API yang interaktif.

1.  Jalankan backend.
2.  Buka `http://127.0.0.1:8000/docs` di browser Anda untuk melihat **Swagger UI**.
3.  Buka `http://127.0.0.1:8000/redoc` untuk melihat **ReDoc**.

### Uji Coba Admin (Bonus)

Untuk menguji endpoint yang diproteksi (seperti `POST /events`), Anda bisa menggunakan Swagger UI atau halaman `admin.html`.

**Via `admin.html` (Cara Mudah):**

1.  Buka `frontend/admin.html` di browser.
2.  Masukkan kredensial (default):
    - `username`: **admin**
    - `password`: **adminpass**
3.  Klik "Login". Anda akan masuk ke dashboard untuk melakukan CRUD.

**Via Swagger UI:**

1.  Buka `http://127.0.0.1:8000/docs`.
2.  Cari endpoint `POST /token`.
3.  Klik "Try it out".
4.  Isi _required fields_:
    - `grant_type`: **password**
    - `username`: **admin**
    - `password`: **adminpass**
5.  Klik "Execute". Anda akan mendapatkan `access_token` di response body.
6.  Salin `access_token` tersebut (tanpa tanda kutip).
7.  Klik tombol "Authorize" (logo gembok) di kanan atas halaman.
8.  Di jendela pop-up, ketik `Bearer` (spasi) lalu paste token Anda. Contoh: `Bearer eyJhbGciOiJIUz...`
9.  Sekarang Anda bisa menguji endpoint yang terkunci (seperti `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}`).

---
