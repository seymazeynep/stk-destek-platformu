import os
import sys
import subprocess
import webbrowser
import time

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    print("=" * 60)
    print("   🇹🇷 STK DESTEK VE DAYANIŞMA PLATFORMU (BİTİRME PROJESİ)   ")
    print("=" * 60)
    print("\n[1/2] Veritabanı ve API Sunucusu kontrol ediliyor...")

    client_dir = os.path.join(base_dir, "client")
    client_build = os.path.join(client_dir, "dist", "index.html")
    if not os.path.exists(client_build):
        print("[0/2] Web arayüzü hazırlanıyor...")
        if not os.path.exists(os.path.join(client_dir, "node_modules")):
            subprocess.run(["npm", "install"], check=True, cwd=client_dir)
        subprocess.run(["npm", "run", "build"], check=True, cwd=client_dir)

    db_path = os.path.join(base_dir, "server", "data", "stk.db")
    if not os.path.exists(db_path):
        print("⚠️ Veritabanı bulunamadı, import scripti çalıştırılıyor...")
        subprocess.run([sys.executable, os.path.join(base_dir, "scripts", "import_data.py")], check=True, cwd=base_dir)

    print("[2/2] Web Sunucusu Başlatılıyor: http://127.0.0.1:8000")
    print("\n✨ Platform Kullanıma Hazır!")
    print("   Tarayıcınızda açmak için: http://127.0.0.1:8000")
    print("   Durdurmak için: CTRL + C tuşlarına basınız.\n")

    # Automatically open browser after 1.5 seconds
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:8000")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    sys.path.insert(0, os.path.join(base_dir, "server"))
    from app import app
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    main()
