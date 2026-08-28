# 🇹🇷 STK Destek ve Dayanışma Platformu (Bitirme Projesi)

Türkiye'deki **102.301 dernek (DERBİS)** ve **6.851 vakfı (Vakıflar Genel Müdürlüğü)** tek çatı altında toplayan; vatandaşların ihtiyaç duydukları konularda (Burs, Gıda, Afet/Arama Kurtarma, Sağlık, Hukuk vb.) akıllı destek rehberiyle doğru STK'ya ve iletişim kanallarına ulaşabildiği modern, erişilebilir bir dijital platform.

---

## 🌟 Öne Çıkan Temel Özellikler

### 1. 🧭 Akıllı Destek Bulma Sihirbazı (Smart Wizard)
- *"Hangi STK'dan ne konuda destek alabilirim?"* sorusuna adım adım interaktif rehberlik.
- İhtiyaç Konusu (Burs, Gıda Yardımı, Afet & Arama Kurtarma, Sağlık/Medikal, Engelli Hizmetleri, Hukuki Destek, Psikolojik Destek, Hayvan Hakları vb.).
- Hedef Kitle (Öğrenci, Aile, Afetzede, Engelli Birey, Kadın, Çocuk, Yaşlı vb.).
- 81 İl filtreleme ve anlık akıllı eşleştirme algoritması.
- Eşleşen STK'lar için uyumluluk rozetleri (%98 Uyum), tek tıkla **"Doğrudan Destek Talebi / Mesaj Gönder"** formu, telefonla arama ve resmi web sitesine yönlendirme.

### 2. 🏛️ 109.152 STK İçeren Yüksek Hızlı Dizin & Arama Motoru
- **SQLite FTS5 (Full-Text Search):** 109.152 dernek ve vakıf kaydında tam metin araması.
- Dernek/vakıf türü, 81 il ve faaliyet alanı bazında filtreleme.
- Doğrulanmış STK rozetleri, alfabetik ve kuruluş tarihine göre sıralama.
- Kart (Grid) ve Liste görünümleri arasında anlık geçiş.

### 3. 📄 Kapsamlı STK Detay Sayfası & Profil Yönetimi
- Kurum türü ve veri kaynağına göre sicil/kaynak bilgisi, adres, telefon, e-posta ve web sitesi.
- Resmi Doğrulama Rozeti ve Harita Konumu.
- Yürütülen projeler, duyurular ve burs/yardım faaliyetleri zaman çizelgesi.
- Vatandaşların STK'ya doğrudan mesaj/başvuru gönderebilmesi.

### 4. 🔐 STK Temsilcisi Girişi & Yönetim Portalı (Dashboard)
- Dizin içindeki dernek veya vakıf kaydını kurum bilgileriyle sahiplenme ya da yeni STK hesabı oluşturma.
- **Gelen Destek Talepleri Gelen Kutusu:** Vatandaşlardan gelen başvuruları inceleme ve durum güncelleme (Beklemede ⏳, İncelendi 👀, Yanıtlandı ✅).
- Profil Bilgilerini Güncelleme (Telefon, e-posta, web sitesi, kurum adresi, açıklama).
- Yeni Faaliyet ve Duyuru Yayınlama.

### 5. 🚨 Acil Destek & Yardım Numaraları Rehberi
- 112 Acil Çağrı, AFAD 122, Alo 183 Sosyal Destek, Türk Kızılayı 168, Alo 144 Sosyal Yardım vb. resmi hatlara tek tıkla doğrudan arama erişimi.

---

## 🛠️ Mimari ve Teknoloji Yığını

| Katman | Teknoloji / Kütüphane | Açıklama |
|---|---|---|
| **Veritabanı** | SQLite + FTS5 & WAL Mode | 109.152 dernek ve vakıf kaydında tam metin arama |
| **Backend API** | Python FastAPI & Uvicorn | Yüksek performanslı asenkron REST API, JWT yetkilendirme |
| **Frontend** | React 18 + Vite | Modern, modüler ve akıcı bileşen mimarisi |
| **Stil & Tasarım** | Tailwind CSS + Lucide Icons | Apple / Airbnb seviyesinde özgün renk ve tipografi sistemi |
| **Veri İşleme (ETL)** | Python Pandas & OpenPyXL | Excel verilerini temizleme, il-ilçe çözümleme |

---

## 🚀 Kurulum ve Çalıştırma

### İlk kurulum

```bash
python -m pip install -r server/requirements.txt
cd client
npm install
cd ..
python run.py
```

Sonraki çalıştırmalarda klasördeki **`start.bat`** dosyasına çift tıklayabilir veya `python run.py` komutunu kullanabilirsiniz. Frontend build ve güvenli yerel veritabanı eksikse başlatıcı bunları kaynak dosyalardan otomatik oluşturur.

Platform otomatik olarak başlayacak ve tarayıcınızda **`http://127.0.0.1:8000`** adresinde açılacaktır.

### Railway ile yayınlama

Repository Railway'e bağlandığında kökteki `Dockerfile` ve `railway.toml` otomatik kullanılır. Kalıcı kullanıcı ve başvuru verileri için servise `/app/server/data` mount path'iyle bir Railway Volume ekleyin. Production ortamında `COOKIE_SECURE=true`, güçlü bir `JWT_SECRET` ve yayınlanan alan adını içeren `CORS_ALLOW_ORIGINS` değişkenlerini tanımlayın.

---

## 📂 Proje Dizin Yapısı

```
stk-platformu-bitirme-projesi/
├── data.xlsx                 # 102.301 dernek içeren ham veri dosyası
├── data/
│   └── vgm-vakif-listesi.json # 6.851 vakıf içeren VGM kaynak verisi
├── run.py                    # Tek komutla platformu başlatan ana script
├── start.bat                 # Windows çift tık başlatıcısı
├── scripts/
│   └── import_data.py        # Excel'den SQLite FTS5'e aktarım yapan ETL scripti
├── server/
│   ├── app.py                # FastAPI REST API & FTS5 arama motoru
│   ├── data/
│   │   └── stk.db            # İlk çalıştırmada yerelde üretilir; Git'e eklenmez
│   └── requirements.txt
└── client/
    ├── src/
    │   ├── components/       # SmartWizard, StkDirectory, StkDashboard vb.
    │   ├── services/api.js   # API servis katmanı
    │   ├── App.jsx           # Ana React uygulaması
    │   └── index.css         # Tasarım tokenları ve stiller
    └── package.json
```
