# Project Requirements Document
## ATOMS - Airport Technical Operations Maintenance System

---

## 1. Gambaran Umum Project

ATOMS adalah aplikasi web untuk mengelola pemeliharaan peralatan teknis di bandara. Aplikasi ini digunakan oleh tim maintenance untuk mencatat pengecekan peralatan, membuat work order, dan melaporkan masalah peralatan selama shift kerja.

**Teknologi yang Digunakan:**
- React + TypeScript
- Vite (build tool)
- React Router (navigasi)
- Tailwind CSS (styling)
- Axios (API calls)
- Pusher/Laravel Echo (real-time notifications)

---

## 2. Pengguna Sistem

Aplikasi ini digunakan oleh beberapa role:

- **Admin** - Mengelola pengguna dan jadwal
- **Manager Teknik** - Menyetujui laporan dan work order
- **Supervisor CNSD** - Mengawasi divisi CNSD
- **Supervisor TFP** - Mengawasi divisi TFP
- **Teknisi CNSD** - Melakukan pengecekan peralatan CNSD
- **Teknisi TFP** - Melakukan pengecekan peralatan TFP

---

## 3. Fitur Utama

### 3.1 Autentikasi & Profil
- Login dengan email dan password
- Setup tanda tangan digital untuk approval
- Logout

### 3.2 Dashboard
- Menampilkan informasi shift saat ini (pagi/siang/malam)
- Daftar personel yang bertugas di shift aktif
- Checklist pengecekan yang harus diselesaikan
- Work order yang sedang aktif
- Peralatan yang bermasalah (trouble)
- Notifikasi terbaru
- Welcome popup saat login dengan reminder checklist

### 3.3 Work Order Management
### 3.3 Work Order Management

**Jenis Work Order:**
1. **WO Shift** (👥): Work order untuk seluruh personel dalam shift
2. **WO Personal** (👤): Work order khusus untuk satu teknisi tertentu

**Fitur Umum:**
- Membuat work order baru (hanya Admin, Manager, Supervisor)
- Pilih jenis WO: Shift atau Personal
- Melihat daftar semua work order
- Filter work order berdasarkan status (open, in progress, pending, closed)
- Search work order berdasarkan nomor WO atau deskripsi
- Klik row table untuk membuka detail work order
- Melihat detail work order lengkap
- Print dan download work order
- Status tracking: open → in progress → pending → closed

**WO Shift vs WO Personal:**

| Aspek | WO Shift | WO Personal |
|-------|----------|-------------|
| Target | Seluruh personel shift | Satu teknisi tertentu |
| Notifikasi | Semua teknisi di divisi | Hanya teknisi yang dipilih |
| Feedback | Semua teknisi bisa feedback | Hanya teknisi yang ditugaskan |
| Use Case | Tugas rutin shift | Tugas khusus/spesifik |
| Dibuat oleh | Manager/Supervisor | Manager (recommended) |
| Badge | 👥 WO Shift (biru) | 👤 WO Personal (ungu) |

**Permission berdasarkan Role:**

| Fitur | Admin | Manager | Supervisor | Teknisi |
|-------|-------|---------|------------|---------|
| Lihat daftar WO | ✅ | ✅ | ✅ | ✅ |
| Buat WO Shift | ✅ | ✅ | ✅ | ❌ |
| Buat WO Personal | ✅ | ✅ | ✅ | ❌ |
| Edit WO | ✅ | ✅ | ✅ | ❌ |
| Delete WO | ✅ | ✅ | ✅ | ❌ |
| Print WO | ✅ | ✅ | ✅ | ✅ |
| Download WO | ✅ | ✅ | ✅ | ✅ |
| Beri Feedback | ✅ | ✅ | ✅ | ✅ (hanya WO yang ditugaskan) |

**Feedback Teknisi:**
Teknisi dapat memberikan feedback pada work order yang ditugaskan:
- Status penyelesaian:
  - ✅ Selesai
  - ⏳ Belum Selesai (Dilanjutkan Shift Berikutnya)
  - ❌ Tidak Dapat Diselesaikan
- Catatan kendala yang dihadapi
- Usulan/saran untuk perbaikan
- Form feedback hanya muncul untuk WO yang belum closed

**Notifikasi WO Personal:**
- Ketika Manager membuat WO Personal, notifikasi otomatis dikirim ke teknisi yang ditugaskan
- Teknisi menerima notifikasi real-time
- WO Personal ditandai dengan badge ungu 👤
- Hanya teknisi yang ditugaskan yang bisa memberikan feedback

### 3.4 CNSD (Komunikasi, Navigasi, Surveilans & Data)
- Daftar kategori peralatan CNSD
- Form pengecekan peralatan CNSD (EQ-1, dll)
- Mencatat status peralatan (Normal/Tidak Normal)
- Mencatat meter reading
- Menandai peralatan yang bermasalah
- Lokasi peralatan

### 3.5 TFP (Teknik Fasilitas Penunjang)
- Daftar kategori peralatan TFP
- Form pengecekan peralatan TFP (AOB Ground, dll)
- Pemeriksaan kinerja fasilitas listrik
- Pengukuran panel listrik dan UPS
- Kondisi fasilitas (Baik/Tidak Baik)
- Lokasi peralatan

### 3.6 Ground Check (Coming Soon)
- Pemeriksaan kondisi area operasional bandara
- Runway inspection (kondisi permukaan, marking, threshold)
- Taxiway & apron inspection
- Lighting system check (runway, taxiway, approach)
- Photo documentation untuk setiap pemeriksaan
- Laporan kondisi area operasional

### 3.7 Grounding System (Coming Soon)
- Pemeriksaan sistem grounding penangkal petir
- Lightning protection system inspection
- Pengukuran nilai tahanan grounding dengan earth tester
- Inspeksi sumur grounding (earth pit)
- Pembuatan laporan hasil pemeriksaan grounding
- Photo documentation untuk dokumentasi kondisi
- Grafik tren nilai tahanan grounding
- Standar referensi: PUIL 2011, SNI 03-7015-2004, IEC 62305, IEEE Std 142

### 3.8 Reporting (Coming Soon)
- Laporan kondisi fasilitas
- Evaluasi kinerja
- Laporan kerusakan
- Riwayat pemeliharaan
- Status approval (draft, pending manager, final, rejected)

### 3.8 Reporting (Coming Soon)
- Laporan kondisi fasilitas
- Evaluasi kinerja
- Laporan kerusakan
- Riwayat pemeliharaan
- Status approval (draft, pending manager, final, rejected)

### 3.9 Logbook (Coming Soon)
- Upload file logbook bulanan
- Melihat riwayat logbook per divisi

### 3.10 Admin Panel (Coming Soon)
- Manajemen user
- Manajemen jadwal shift

---

## 4. Konsep Penting

### 4.1 Shift System
Aplikasi bekerja berdasarkan sistem shift:
- **Shift Pagi**: 07:00 - 13:00 WIB
- **Shift Siang**: 13:00 - 19:00 WIB
- **Shift Malam**: 19:00 - 07:00 WIB

Setiap shift memiliki personel yang ditugaskan dan checklist yang harus diselesaikan.

### 4.2 Divisi
Ada 2 divisi utama:
- **CNSD**: Mengelola peralatan komunikasi, navigasi, surveilans, dan data
- **TFP**: Mengelola fasilitas teknik dan tenaga listrik

### 4.3 Status Work Order
- **Open**: WO baru dibuat, belum dikerjakan
- **In Progress**: Sedang dikerjakan
- **Pending**: Tertunda, menunggu sesuatu
- **Closed**: Sudah selesai

### 4.4 Tanda Tangan Digital
Setiap user dapat membuat tanda tangan digital yang digunakan untuk approval work order dan laporan.

---

## 5. Struktur Halaman

```
/login                          → Halaman login
/setup-signature                → Setup tanda tangan digital
/dashboard                      → Dashboard utama
/work-orders                    → Daftar work order
/work-orders/create             → Buat work order baru
/work-orders/:id                → Detail work order
/cnsd                           → Index kategori CNSD
/cnsd/eq-1                      → Form pengecekan EQ-1 (coming soon)
/tfp                            → Index kategori TFP
/tfp/aob-ground                 → Form pengecekan AOB Ground (coming soon)
/ground-check                   → Index Ground Check (coming soon)
/ground-check/:code/coming-soon → Detail pemeriksaan ground (coming soon)
/grounding                      → Index Grounding System (coming soon)
/grounding/:code/coming-soon    → Detail pemeriksaan grounding (coming soon)
/reports                        → Laporan (coming soon)
/logbooks                       → Logbook (coming soon)
/admin/users                    → Manajemen user (coming soon)
/admin/schedules                → Manajemen jadwal (coming soon)
/profile                        → Profil user (coming soon)
```

---

## 6. Komponen UI yang Tersedia

Aplikasi memiliki komponen reusable:
- **Badge**: Label kecil untuk status/kategori
- **Button**: Tombol dengan berbagai variant
- **Card**: Container untuk konten
- **Input**: Input text
- **Select**: Dropdown select
- **Textarea**: Input text multi-line
- **Table**: Tabel data dengan fitur klik row
- **Tabs**: Tab navigation
- **Modal**: Dialog popup
- **ConfirmDialog**: Dialog konfirmasi
- **StatusBadge**: Badge khusus untuk status WO
- **ShiftBadge**: Badge khusus untuk shift
- **SignatureDisplay**: Menampilkan tanda tangan
- **Skeleton**: Loading placeholder
- **EmptyState**: State kosong
- **ComingSoonCard**: Card untuk fitur yang belum aktif

---

## 7. Interaksi User dengan Work Order

### 7.1 Untuk Admin/Manager/Supervisor
**Membuat WO Shift:**
1. Masuk ke halaman Work Orders
2. Klik tombol "Buat WO"
3. Pilih jenis "WO Shift"
4. Pilih divisi (CNSD/TFP)
5. Isi deskripsi perintah kerja
6. Pilih output yang diharapkan
7. Sistem otomatis assign ke semua teknisi dalam shift
8. Klik "Simpan Work Order"

**Membuat WO Personal:**
1. Masuk ke halaman Work Orders
2. Klik tombol "Buat WO"
3. Pilih jenis "WO Personal"
4. Pilih divisi (CNSD/TFP)
5. Pilih teknisi tertentu dari dropdown
6. Isi deskripsi perintah kerja
7. Pilih output yang diharapkan
8. Sistem akan kirim notifikasi ke teknisi yang dipilih
9. Klik "Simpan Work Order"

**Melihat WO:**
- Klik row table untuk membuka detail WO
- Bisa edit, delete, print, atau download WO
- Melihat feedback dari teknisi

### 7.2 Untuk Teknisi
**Melihat WO yang Ditugaskan:**
1. Masuk ke halaman Work Orders
2. Lihat daftar WO (Shift dan Personal)
3. WO Personal ditandai dengan badge ungu 👤
4. Klik row table untuk membuka detail WO

**Memberikan Feedback:**
1. Scroll ke bawah untuk melihat "Form Feedback Teknisi"
2. Pilih status penyelesaian (wajib)
3. Isi catatan kendala (opsional)
4. Isi usulan/saran (opsional)
5. Klik "Simpan Feedback"

**Notifikasi WO Personal:**
- Teknisi menerima notifikasi real-time ketika Manager assign WO Personal
- Notifikasi muncul di bell icon (top bar)
- Klik notifikasi untuk langsung ke detail WO

---

## 8. Context & State Management

### 7.1 AuthContext
Mengelola autentikasi user:
- User data
- Token
- Login/logout
- Update user

### 7.2 NotificationContext
Mengelola notifikasi real-time

### 7.3 ThemeContext
Mengelola tema (light/dark mode)

---

## 9. Data Mock

Saat ini aplikasi menggunakan data mock (dummy) untuk development:
- Mock shift schedule
- Mock checklist
- Mock work orders
- Mock trouble equipment
- Mock notifications
- Mock CNSD categories
- Mock TFP categories

Data ini akan diganti dengan API call ke backend Laravel nantinya.

---

## 10. Fitur yang Sudah Aktif vs Coming Soon

### ✅ Sudah Aktif (MVP)
- Login & setup signature
- Dashboard dengan welcome popup
- Work order list dengan role-based access control
- Work order create dengan 2 jenis: WO Shift dan WO Personal
- Work order detail dengan form feedback untuk teknisi
- Badge untuk membedakan WO Shift (biru) dan WO Personal (ungu)
- Klik row table untuk membuka detail WO
- Filter dan search work order
- Permission system lengkap (Admin/Manager/Supervisor vs Teknisi)
- Action menu dengan conditional buttons (Edit/Delete hanya untuk Admin/Manager/Supervisor)
- Notifikasi untuk WO Personal (akan dikirim ke teknisi yang ditugaskan)
- CNSD index page
- TFP index page
- Ground Check index page (coming soon placeholder)
- Grounding System index page (coming soon placeholder)
- Quick navigation dengan 7 modul
- Shift tracking
- Checklist progress

### 🔜 Coming Soon (Priority 2)
- Form pengecekan CNSD (EQ-1)
- Form pengecekan TFP (AOB Ground)
- Form pengecekan Ground Check (Runway, Taxiway, Apron, Lighting)
- Form pemeriksaan Grounding (Lightning Protection, Measurement, Earth Pit)
- Laporan Grounding dengan grafik tren
- Work order create & edit page
- Reporting module
- Logbook module
- Admin panel
- Profile page
- Real-time notifications
- Print & export features

---

## 11. Integrasi Backend

Aplikasi ini dirancang untuk terhubung dengan backend Laravel:
- Base URL API dari environment variable
- Axios untuk HTTP requests
- Token-based authentication
- Laravel Echo + Pusher untuk real-time updates

File konfigurasi: `.env`

---

## 12. Styling & Design System

**Enterprise-Grade UI/UX (Updated v1.3):**

### Color Palette:
- **Background**: Gray-50 (bg-gray-50) untuk kontras maksimal dengan card putih
- **Cards**: White (bg-white) dengan border gray-200 dan shadow-sm
- **Primary/Brand**: Blue-700/Blue-800 untuk navigasi dan CTA
- **Status Semantik**:
  - Red-500/600: Trouble/Error
  - Amber-500: Pending/In Progress  
  - Emerald-500: Selesai/Normal
  - Blue-700: Primary actions

### Component Styling:
- **Cards**: bg-white, border border-gray-200, shadow-sm, rounded-lg
- **Badges**: Soft style dengan bg-{color}-50 dan text-{color}-700
- **Typography**:
  - Judul: font-bold, text-gray-800, text-base/lg
  - Sekunder: text-gray-500, text-sm/xs
  - Hierarki yang jelas dan konsisten

### Layout & Spacing:
- **Grid**: CSS Grid dengan gap-6 untuk spacing konsisten
- **Whitespace**: Padding p-6 pada cards, ruang napas yang luas
- **Max Width**: max-w-7xl untuk readability optimal
- **Responsive**: Mobile-first dengan breakpoint yang jelas

### Specific Elements:
- **Quick Navigation**: Compact horizontal layout dengan icon + label
- **Notifikasi**: Vertical timeline dengan dot indicator
- **Work Order List**: Badge status aligned ke kanan
- **Progress Bar**: Height 3 (h-3) dengan warna blue-700

### Dark Mode:
- Fully supported dengan dark: prefix
- Background: slate-900
- Cards: slate-800
- Borders: slate-700
- Text: slate-100/200/300/400

---

## 13. Routing & Navigation

- **Protected Routes**: Memerlukan login
- **Public Routes**: Login page
- **Layout**: AppShell dengan Sidebar + Topbar
- **Navigation**: Sidebar untuk desktop, mobile menu untuk mobile

---

## 14. Cara Kerja Aplikasi

1. User login dengan email & password
2. Jika belum ada signature, diarahkan ke setup signature
3. Masuk ke dashboard, melihat shift aktif dan checklist
4. Mengerjakan checklist pengecekan (CNSD/TFP)
5. Membuat work order jika ada tugas maintenance
6. Mencatat peralatan yang bermasalah
7. Manager/Supervisor mereview dan approve
8. Data tersimpan untuk reporting dan logbook

---

## 15. Kebutuhan Review & Revisi

Untuk mereview dan merevisi aplikasi ini, fokus pada:

1. **User Flow**: Apakah alur kerja sudah sesuai dengan proses maintenance di lapangan?
2. **Form Input**: Apakah form pengecekan sudah mencakup semua parameter yang dibutuhkan?
3. **Status Tracking**: Apakah status work order sudah cukup atau perlu ditambah?
4. **Reporting**: Format laporan apa yang dibutuhkan?
5. **Permissions**: Siapa boleh melakukan apa? (role-based access)
6. **Notifications**: Event apa saja yang perlu notifikasi?
7. **Mobile Experience**: Apakah UI sudah nyaman digunakan di tablet/mobile?
8. **Performance**: Apakah loading time sudah cukup cepat?

---

## 16. Catatan Teknis

- Aplikasi menggunakan TypeScript untuk type safety
- Semua komponen menggunakan React Hooks
- Styling dengan Tailwind CSS utility classes
- Dark mode menggunakan Tailwind dark: prefix
- Form validation belum diimplementasi (perlu ditambahkan)
- Error handling masih minimal (perlu diperbaiki)
- Testing belum ada (perlu ditambahkan)

---

## 17. Changelog & Bug Fixes

### Version 1.5 - Grounding System Module (NEW)

**New Module:**
1. ✅ Grounding System - Modul pemeriksaan sistem grounding penangkal petir
   - Halaman index Grounding dengan coming soon placeholder
   - Kategori pemeriksaan: Lightning Protection, Grounding Measurement, Earth Pit Inspection, Grounding Report
   - Deskripsi fitur yang akan tersedia
   - Icon petir (Zap) dengan warna kuning untuk branding
   - Standar referensi: PUIL 2011, SNI 03-7015-2004, IEC 62305, IEEE Std 142

2. ✅ Navigation updates
   - Menambahkan Grounding ke Quick Navigation di Dashboard
   - Menambahkan Grounding System ke Sidebar menu
   - Grid Quick Navigation diubah menjadi 2 kolom di mobile, 4 kolom di desktop (7 modul total)
   - Responsive layout yang optimal

3. ✅ Route configuration
   - Route `/grounding` untuk halaman index
   - Route `/grounding/:code/coming-soon` untuk detail pemeriksaan
   - Terintegrasi dengan ProtectedRoute dan AppShell

**Fitur yang Akan Dikembangkan:**
- Lightning Protection System: Inspeksi visual air terminal, down conductor, dan grounding electrode
- Grounding Measurement: Pengukuran nilai tahanan grounding dengan earth tester
- Earth Pit Inspection: Pemeriksaan kondisi fisik sumur grounding, elektroda, dan koneksi
- Grounding Report: Laporan hasil pemeriksaan dengan grafik tren dan rekomendasi
- Photo Documentation: Upload foto kondisi sistem grounding

**Role Access:**
- Manager Teknik: Full access
- Supervisor CNSD & TFP: Full access
- Teknisi CNSD & TFP: Full access

---

### Version 1.4 - Ground Check Module (NEW)

**New Module:**
1. ✅ Ground Check - Modul pemeriksaan area operasional bandara
   - Halaman index Ground Check dengan coming soon placeholder
   - Kategori pemeriksaan: Runway, Taxiway, Apron, Lighting System
   - Deskripsi fitur yang akan tersedia
   - Icon pesawat (Plane) dengan warna ungu untuk branding

2. ✅ Navigation updates
   - Menambahkan Ground Check ke Quick Navigation di Dashboard
   - Menambahkan Ground Check ke Sidebar menu
   - Grid Quick Navigation diubah dari 5 kolom menjadi 6 kolom (3 kolom di mobile, 6 di desktop)
   - Responsive layout untuk mobile dan desktop

3. ✅ Route configuration
   - Route `/ground-check` untuk halaman index
   - Route `/ground-check/:code/coming-soon` untuk detail pemeriksaan
   - Terintegrasi dengan ProtectedRoute dan AppShell

**Fitur yang Akan Dikembangkan:**
- Runway Inspection: Pemeriksaan kondisi permukaan runway, marking, dan threshold
- Taxiway & Apron Check: Pemeriksaan kondisi taxiway, apron, dan parking stand
- Lighting System Check: Pemeriksaan sistem penerangan runway, taxiway, dan approach
- Photo Documentation: Upload foto kondisi area untuk dokumentasi dan pelaporan

**Role Access:**
- Manager Teknik: Full access
- Supervisor CNSD & TFP: Full access
- Teknisi CNSD & TFP: Full access

---

### Version 1.3 - Enterprise UI/UX Redesign (COMPLETED)

**Major UI/UX Overhaul:**
1. ✅ Enterprise-grade color palette
   - Background: Gray-50 untuk kontras maksimal
   - Cards: Pure white dengan border tipis gray-200
   - Primary: Blue-700/800 untuk brand consistency
   - Status colors: Red-600 (error), Amber-500 (pending), Emerald-500 (success)

2. ✅ Component redesign dengan clean aesthetic
   - Cards: Consistent padding (p-6), border, dan shadow-sm
   - Badges: Soft style dengan background muda dan text pekat
   - Typography: Hierarki yang jelas (bold untuk judul, semibold untuk content)
   - Spacing: Gap-6 konsisten di semua grid

3. ✅ Quick Navigation - Compact horizontal layout
   - Dari vertical card menjadi horizontal button
   - Icon + label dalam satu baris
   - Menghemat space vertikal
   - Hover effect yang halus

4. ✅ Notifikasi - Vertical Timeline
   - Garis vertikal sebagai timeline
   - Dot indicator untuk unread (blue) vs read (gray)
   - Ring effect pada notifikasi baru
   - Spacing yang lebih baik antar item

5. ✅ Badge placement optimization - Reduced cognitive load
   - Shift info: Dipindah dari badge ke header subtitle dengan emoji
   - Personel Bertugas: Count di header, bukan badge shift
   - Checklist: Division name di subtitle, bukan badge terpisah
   - Work Order: Division badge inline dengan WO number
   - Trouble Equipment: Division name inline dengan text, bukan badge terpisah

6. ✅ Layout improvements
   - Max-width container (max-w-7xl) untuk readability
   - Consistent gap-6 di semua grid
   - Whitespace yang luas (p-6 pada cards)
   - Border yang konsisten (border-gray-200)

**Design Principles Applied:**
- Clean & minimal aesthetic
- Enterprise-grade professionalism
- High readability dengan kontras yang baik
- Consistent spacing dan alignment
- Semantic colors untuk status
- Reduced badge overload untuk better UX
- Information hierarchy yang jelas

---

### Version 1.2 - Work Order Personal & Notification System

**New Features:**
1. ✅ WO Personal - Work Order untuk teknisi tertentu
   - Manager dapat membuat WO khusus untuk satu teknisi
   - Pilihan jenis WO: Shift (semua personel) atau Personal (satu teknisi)
   - Dropdown untuk memilih teknisi tertentu
   - Badge ungu 👤 untuk WO Personal, badge biru 👥 untuk WO Shift
   - Notifikasi otomatis dikirim ke teknisi yang ditugaskan
   
2. ✅ UI/UX untuk pembuatan WO Personal
   - Radio button untuk memilih jenis WO (Shift vs Personal)
   - Dropdown teknisi muncul hanya untuk WO Personal
   - Info box menjelaskan perbedaan WO Shift dan Personal
   - Preview personel yang akan menerima WO
   - Validasi: WO Personal wajib pilih teknisi

3. ✅ Badge system untuk jenis WO
   - Badge biru untuk WO Shift
   - Badge ungu untuk WO Personal
   - Tampil di list dan detail WO

**Data Model Updates:**
1. ✅ Added `wo_type` field: 'shift' | 'personal'
2. ✅ Added `assigned_technician_id` field for personal WO
3. ✅ Updated WorkOrder interface in types
4. ✅ Added mock data example for personal WO

**Backend Integration Notes:**
- WO Personal akan trigger notifikasi ke teknisi yang ditugaskan
- Notifikasi menggunakan Laravel Echo + Pusher
- Teknisi hanya bisa feedback pada WO yang ditugaskan ke mereka

---

### Version 1.1 - Work Order Permission & UX Improvements

**Bug Fixes:**
1. ✅ Fixed error "Cannot read properties of undefined" pada form feedback teknisi
   - Mengganti komponen Select dengan native HTML select element
   
2. ✅ Fixed permission bug - Teknisi bisa membuat WO
   - Menambahkan role-based access control
   - Button "Buat WO" hanya muncul untuk Admin/Manager/Supervisor
   
3. ✅ Fixed action menu - Teknisi melihat tombol Edit/Delete
   - Tombol Edit dan Delete hanya muncul untuk Admin/Manager/Supervisor
   - Teknisi hanya melihat Print dan Download

**New Features:**
1. ✅ Klik row table untuk membuka detail WO
   - User tidak perlu klik menu action untuk melihat detail
   - Lebih intuitif dan cepat
   
2. ✅ Form feedback teknisi yang lengkap
   - Dropdown status penyelesaian (wajib)
   - Textarea catatan kendala (opsional)
   - Textarea usulan/saran (opsional)
   - Button Simpan dan Reset
   - Hanya muncul untuk teknisi dan WO yang belum closed

**UI/UX Improvements:**
1. ✅ Removed button "Import Excel" dan "Upload Scan" (belum diimplementasi)
2. ✅ Action menu dengan conditional rendering berdasarkan role
3. ✅ Dropdown menu position (drop-up untuk row terakhir)
4. ✅ Cursor pointer pada row table yang bisa diklik

---

**Dokumen ini dibuat untuk memudahkan review dan revisi aplikasi ATOMS tanpa perlu membaca detail kode.**
