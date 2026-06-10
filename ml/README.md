# Waste Classification ML Pipeline

Pipeline ini dipakai untuk melatih, menguji, dan mencoba model klasifikasi sampah dari dataset lokal.

## 1. Masuk ke folder ML

```powershell
cd D:\mobile\CyberWasteApp\ml
```

## 2. Buat virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Jika PowerShell menolak aktivasi script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 3. Install dependency

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Split dataset

Dataset sumber saat ini:

```text
D:\mobile\CyberWasteApp\dataset\dataset-sampah
```

Struktur dataset harus berupa satu folder per kelas:

```text
dataset-sampah/
  botol plastik/
  kaca/
  kardus/
  kertas/
  metal/
  Organic/
  plastic/
```

Jalankan:

```powershell
python split_dataset.py --source ..\dataset\dataset-sampah --output data_split
```

Output:

```text
ml/data_split/
  train/
  val/
  test/
```

Default split:

```text
70% train
15% validation
15% test
```

## 5. Training model

```powershell
python train_model.py --data-dir data_split --output-dir artifacts --epochs 20
```

Output training:

```text
ml/artifacts/best_model.keras
ml/artifacts/waste_model.keras
ml/artifacts/waste_model.tflite
ml/artifacts/labels.json
ml/artifacts/history.json
ml/artifacts/training_history.png
```

Model yang disarankan untuk dipakai adalah:

```text
artifacts/best_model.keras
```

## 6. Testing model

```powershell
python test_model.py --data-dir data_split --model artifacts\best_model.keras
```

Output testing:

```text
ml/artifacts/test_report.txt
ml/artifacts/confusion_matrix.csv
ml/artifacts/confusion_matrix.png
```

Yang harus dilihat:

- `Test accuracy`
- precision per kelas
- recall per kelas
- confusion matrix

Jika hasil masih jelek, perbaiki dataset:

- tambah gambar untuk kelas yang sering salah
- hapus gambar blur atau label salah
- pastikan jumlah gambar tiap kelas seimbang
- tambah variasi background dan cahaya

## 7. Coba prediksi satu gambar

```powershell
python predict_image.py --image "..\dataset\dataset-sampah\botol plastik\botol (1).png" --model artifacts\best_model.keras
```

Contoh output:

```json
{
  "label": "botol plastik",
  "category": "Anorganik",
  "confidence": 0.94,
  "points": 10
}
```

## 8. Integrasi ke aplikasi

Tahap berikutnya setelah model bagus:

1. Tambah endpoint backend `POST /api/predict-waste`.
2. Frontend Expo ambil foto dari kamera.
3. Foto dikirim ke backend.
4. Backend menjalankan model.
5. Backend mengembalikan `label`, `category`, `confidence`, dan `points`.
6. Frontend menampilkan hasil scan.
7. Simpan hasil ke history dan tambahkan Eco Poin.

## 9. Testing scan dari aplikasi mobile

Pastikan file ini sudah ada:

```text
ml/artifacts/best_model.keras
ml/artifacts/labels.json
```

Jalankan backend dari root project:

```powershell
cd D:\mobile\CyberWasteApp\backend
npm install
npm start
```

Jika package backend belum punya script start, jalankan:

```powershell
node index.js
```

Backend akan membuka:

```text
http://localhost:5000/api
```

Jika Python virtual environment ML ada di `ml/.venv`, backend akan otomatis memakainya. Jika venv berada di lokasi lain, set env var:

```powershell
$env:ML_PYTHON_PATH="D:\mobile\CyberWasteApp\ml\.venv\Scripts\python.exe"
node index.js
```

Jalankan Expo dari root project:

```powershell
cd D:\mobile\CyberWasteApp
npm start
```

Buka aplikasi mobile, login, lalu masuk ke tab:

```text
Scan
```

Alur testing:

```text
Scan tab -> izinkan kamera -> Scan Sekarang -> foto dikirim ke backend -> backend menjalankan model -> hasil muncul di app
```

Hasil yang tampil:

```text
Jenis sampah
Kategori
Akurasi
Eco Poin
```

Catatan Android emulator:

```text
config.ts memakai http://10.0.2.2:5000/api untuk Android emulator.
```

Jika pakai HP fisik, ganti `API_URL` ke IP laptop satu jaringan, contoh:

```text
http://192.168.1.10:5000/api
```

## Catatan penting

- Training sebaiknya dilakukan di laptop/PC, bukan di HP.
- Jika CPU lambat, kurangi `--epochs` atau gunakan GPU.
- File `.tflite` disiapkan untuk kemungkinan inferensi langsung di mobile pada tahap berikutnya.
