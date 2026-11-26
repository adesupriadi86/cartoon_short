# Render di GitHub Actions — cara pakai

## Git vs GitHub Actions

Git sendiri cuma tempat nyimpen file (version control) — dia nggak bisa
ngerender. Yang ngerender itu **GitHub Actions**: komputer CI-nya GitHub yang
jalanin workflow di `.github/workflows/render.yml` tiap lu klik Run.

## Yang disiapin

1. Bikin repo baru di GitHub (kosong). Kalau kit/template ini bukan buat
   publik, bikin **private**.
2. Push folder proyek ini jadi isi repo. Jangan ikut push `frames/` dan
   `out/` (dibangun ulang sama CI). Yang harus ada di repo: `web/`,
   `engine/`, `tools/`, `audio.py`, `script.txt`, `voice.mp3`,
   `mix_raw.wav`, `work/`, `.github/workflows/render.yml`.
3. Di GitHub: tab **Actions** → **Render cartoon short** → **Run workflow**
   → isi judul → Run.
4. Tunggu ~4-6 menit. Hasil akhirnya (MP4) ada di artifact `video` pada job
   `finish`. Frame per chunk ada di artifact `frames-0` … `frames-7`.

## Kenapa lebih cepat

Satu video butuh ~709 frame (on twos). Di VM ini (1,5 core shared) itu
26 menit. Di Actions, 8 runner jalan bareng, masing-masing ~90 frame,
jadi waktu tembok tinggal slice paling lambat + setup (~2 menit) — total
sekitar 4-6 menit. Tetap tanpa GPU: semua runner pakai SwiftShader (CPU),
cuma diparalel. Hasil 3D-nya identik dengan render lokal.

## Biaya (dicek 2026-11-26)

- **Repo publik:** runner Linux standar (4 vCPU / 16 GB) gratis, tanpa batas.
- **Repo private, akun Free:** 2.000 menit Linux/bulan sudah termasuk
  (runner 2 vCPU / 8 GB). Satu video makan ~8 job × ~5 menit = ~40 menit,
  jadi ~50 video/bulan muat di jatah gratis. Di atas itu $0,006/menit.
- Penyimpanan artifact gratis 500 MB (akun Free). Satu run nyimpen
  ~130 MB frame + ~69 MB MP4, dan retention sudah diset pendek (frame
  2 hari, video 7 hari) — hapus artifact lama kalau mau hemat.

## Kalau gagal

- Cek log job yang merah di tab Actions. Yang paling sering: Chrome /
  ChromeDriver nggak ketemu (job `render`), atau ffmpeg nggak ada
  (job `finish` sudah install otomatis kalau belum ada).
- Frame yang gagal di satu chunk bisa di-render ulang lokal dengan
  `RESUME=1` karena nama file-nya sama (`frames/fXXXX.jpg`).

## Cara push (login GitHub tidak bisa dari VM ini)

Endpoint login GitHub (`github.com/login/*`) diblokir dari VM ini — device
flow mengembalikan 404, padahal `api.github.com` bisa dijangkau. Jadi `gh
auth login` tidak bisa jalan di sini. Yang push adalah kamu, dari komputermu:

1. Download zip proyek ini (link dari Muse), unzip.
2. Bikin repo **publik** baru di https://github.com/new — nama bebas, misal
   `escalator-short`. Jangan centang "Add a README".
3. Dari dalam folder hasil unzip:
   ```bash
   git init -b main
   git add .
   git commit -m "Escalator short + render workflow"
   git remote add origin https://github.com/USERNAME/escalator-short.git
   git push -u origin main
   ```
   (Ganti USERNAME dan nama repo. GitHub akan minta login — pakai akunmu.)
4. Di repo itu: tab **Actions** → **Render cartoon short** → **Run workflow**
   → isi judul → Run. Tunggu ~4-6 menit.
5. Hasil MP4 ada di artifact `video` pada job `finish` (klik run-nya,
   scroll ke bawah ke bagian Artifacts).
