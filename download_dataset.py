import os
import sys
import shutil

# Memastikan package kagglehub terpasang
try:
    import kagglehub
except ImportError:
    print("Package 'kagglehub' tidak ditemukan. Menginstal via pip...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
    import kagglehub

def main():
    print("Mulai mengunduh dataset dari Kaggle (hairulyasin/dataset-sampah)...")
    try:
        # Mengunduh versi terbaru dari dataset
        cache_path = kagglehub.dataset_download("hairulyasin/dataset-sampah")
        print(f"Dataset berhasil diunduh ke cache: {cache_path}")
        
        # Lokasi target folder dataset lokal di dalam proyek
        target_dir = os.path.join(os.path.dirname(__file__), "dataset")
        
        # Membuat folder dataset jika belum ada
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            print(f"Membuat folder target: {target_dir}")
            
        print("Memindahkan file dataset ke folder lokal 'dataset/'...")
        
        # Melakukan penyalinan file dari cache ke folder lokal dataset/
        copied_count = 0
        for item in os.listdir(cache_path):
            s = os.path.join(cache_path, item)
            d = os.path.join(target_dir, item)
            
            # Jika item adalah folder/direktori
            if os.path.isdir(s):
                if os.path.exists(d):
                    shutil.rmtree(d) # Hapus jika sudah ada versi sebelumnya
                shutil.copytree(s, d)
                print(f" Menyalin folder: {item} -> dataset/")
                copied_count += 1
            # Jika item adalah berkas/file (kecuali readme bawaan cache)
            elif os.path.isfile(s) and item.lower() != "readme.md":
                shutil.copy2(s, d)
                print(f" Menyalin file: {item} -> dataset/")
                copied_count += 1
                
        print("\nKonfigurasi dataset selesai!")
        print(f"Semua file ({copied_count} item) telah berhasil disalin ke folder lokal: {target_dir}")
        
    except Exception as e:
        print(f"\nTerjadi kesalahan saat mengunduh/menyalin dataset: {e}")

if __name__ == "__main__":
    main()
