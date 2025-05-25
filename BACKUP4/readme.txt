DOKUMENTASI WEBSITE MONITORING 3KIOSK
====================================

DESKRIPSI
---------
Website ini adalah sistem monitoring untuk 3Kiosk yang menampilkan data pencapaian, target, dan file raw dalam format yang mudah dibaca dan dianalisis.

HALAMAN
-------
1. Dashboard (index.html)
   - Menampilkan ringkasan pencapaian 3Kiosk
   - Menampilkan data Trade Demand dan RGU GA Trad
   - Menampilkan peringkat berdasarkan Total Score
   - Menampilkan data Sellin 300K

2. Target 3Kiosk (target-3kiosk.html)
   - Menampilkan data target untuk setiap 3Kiosk
   - Filter berdasarkan ID, Micro Cluster, dan Nama 3Kiosk
   - Fitur pencarian global

3. File Raw (file-raw.html)
   - Menampilkan data mentah dari file Excel
   - Filter berdasarkan ID dan Kecamatan
   - Fitur pagination untuk membatasi jumlah data yang ditampilkan
   - Fitur pencarian global

FITUR UTAMA
-----------
1. Upload File Excel
   - Mendukung format .xlsx
   - Otomatis memproses dan menampilkan data
   - Validasi format file

2. Filter dan Pencarian
   - Filter dropdown untuk setiap kolom penting
   - Pencarian global di semua kolom
   - Reset filter untuk mengembalikan tampilan awal

3. Download Data
   - Download data dalam format Excel
   - Mempertahankan format dan styling
   - Termasuk header yang sesuai

4. Responsive Design
   - Tampilan yang responsif untuk desktop dan mobile
   - Menu hamburger untuk tampilan mobile
   - Tabel dengan scroll horizontal untuk data yang banyak

5. Real-time Updates
   - Pembaruan otomatis saat ada perubahan data
   - Notifikasi saat upload berhasil/gagal
   - Tampilan tanggal otomatis

UPDATE TERAKHIR
--------------
1. Perbaikan Filter
   - Perbaikan logika filter untuk halaman raw dan target
   - Penambahan fitur search term
   - Optimasi performa filter

2. Perbaikan Tampilan
   - Penyesuaian warna untuk indikator pencapaian
   - Perbaikan tampilan tabel
   - Penambahan freeze column untuk kolom penting

3. Perbaikan Fungsi
   - Optimasi loading data
   - Perbaikan perhitungan Total Score
   - Perbaikan perhitungan Rank

TEKNOLOGI
---------
1. Frontend
   - HTML5
   - CSS3
   - JavaScript (Vanilla)
   - SheetJS untuk manipulasi Excel

2. Backend
   - Firebase Firestore untuk penyimpanan data
   - Firebase Storage untuk file Excel

3. Library
   - XLSX.js untuk manipulasi file Excel
   - Firebase SDK

PENGGUNAAN
----------
1. Upload File
   - Klik tombol "Choose File"
   - Pilih file Excel yang sesuai
   - Tunggu proses upload selesai

2. Filter Data
   - Gunakan dropdown filter untuk memfilter data
   - Gunakan search box untuk pencarian global
   - Klik "Reset" untuk menghapus semua filter

3. Download Data
   - Klik tombol "Download Excel"
   - File akan otomatis terdownload
   - Format file sesuai dengan tampilan di website

CATATAN
-------
- Pastikan format file Excel sesuai dengan template yang ada
- Data akan otomatis diperbarui saat ada perubahan
- Backup data secara berkala untuk keamanan 