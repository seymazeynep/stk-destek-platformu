import argparse
import datetime
import json
import os
import sqlite3
import sys

import pandas as pd

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, 'server', 'data')
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'stk.db')
EXCEL_PATH = os.path.join(BASE_DIR, 'data.xlsx')
DEFAULT_VGM_PATH = os.path.join(BASE_DIR, 'data', 'vgm-vakif-listesi.json')


def migrate_schema(conn):
    """Add source metadata without replacing any existing tables or rows."""
    columns = {row[1] for row in conn.execute("PRAGMA table_info(stks)")}
    additions = {
        'kurum_turu': "TEXT NOT NULL DEFAULT 'dernek'",
        'veri_kaynagi': "TEXT NOT NULL DEFAULT 'DERBIS'",
        'kaynak_id': 'TEXT',
        'vakif_kategori_id': 'INTEGER',
        'hibe_veriyor': 'INTEGER',
        'faks': 'TEXT',
    }
    for name, definition in additions.items():
        if name not in columns:
            conn.execute(f"ALTER TABLE stks ADD COLUMN {name} {definition}")

    conn.execute("""
        UPDATE stks
        SET kurum_turu = 'dernek', veri_kaynagi = 'DERBIS'
        WHERE veri_kaynagi IS NULL OR veri_kaynagi = ''
           OR kurum_turu IS NULL OR kurum_turu = ''
    """)
    conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_stks_source_id
        ON stks(veri_kaynagi, kaynak_id)
        WHERE kaynak_id IS NOT NULL AND kaynak_id != ''
    """)


def parse_vgm_location(value):
    parts = [part.strip() for part in (value or '').split('/')]
    city = parts[0] if parts and parts[0] else 'Belirtilmemiş'
    if city in ('İstanbul (Avrupa)', 'İstanbul (Anadolu)'):
        city = 'İstanbul'
    district = parts[1] if len(parts) > 1 else ''
    return city, district


def import_vgm(conn, json_path):
    with open(json_path, encoding='utf-8') as source:
        records = json.load(source)

    migrate_schema(conn)
    sql = """
        INSERT INTO stks (
            kurum_adi, kurum_adresi, il, ilce, telefon, email, faks,
            kurum_turu, veri_kaynagi, kaynak_id, vakif_kategori_id,
            hibe_veriyor, faaliyet_alani, detayli_faaliyet, kutuk_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'vakif', 'VGM', ?, ?, ?, ?, ?, ?)
        ON CONFLICT(veri_kaynagi, kaynak_id) WHERE kaynak_id IS NOT NULL AND kaynak_id != ''
        DO UPDATE SET
            kurum_adi = excluded.kurum_adi,
            kurum_adresi = excluded.kurum_adresi,
            il = excluded.il,
            ilce = excluded.ilce,
            telefon = excluded.telefon,
            email = excluded.email,
            faks = excluded.faks,
            kurum_turu = excluded.kurum_turu,
            vakif_kategori_id = excluded.vakif_kategori_id,
            hibe_veriyor = excluded.hibe_veriyor,
            faaliyet_alani = excluded.faaliyet_alani,
            detayli_faaliyet = excluded.detayli_faaliyet,
            kutuk_no = excluded.kutuk_no
    """
    rows = []
    for record in records:
        city, district = parse_vgm_location(record.get('CityAndState'))
        name = (record.get('FT_Name_List') or {}).get('TranslatedValue') or record.get('SortColumn') or ''
        description = (record.get('FT_Description_List') or {}).get('TranslatedValue') or ''
        category_id = record.get('FK_FoundationCategory_Id')
        rows.append((
            name.strip(), (record.get('Address') or '').strip(), city, district,
            (record.get('Phone') or '').strip(), (record.get('Email') or '').strip(),
            (record.get('Fax') or '').strip(), str(record['Id']), category_id,
            1 if record.get('Grant') is True else 0,
            'Vakıf', f'VGM vakıf kategorisi: {category_id}' if category_id is not None else '',
            description.strip(),
        ))

    before = conn.total_changes
    conn.executemany(sql, rows)
    conn.execute("INSERT INTO stks_fts(stks_fts) VALUES('rebuild')")
    conn.commit()
    return len(records), conn.total_changes - before


parser = argparse.ArgumentParser(description='STK verilerini güvenli şekilde içe aktarır.')
parser.add_argument('--vgm-only', action='store_true', help='Yalnız VGM JSON verisini migrate/upsert et')
parser.add_argument('--vgm-json', default=DEFAULT_VGM_PATH, help='VGM JSON dosyasının yolu')
parser.add_argument('--reset', action='store_true', help='Mevcut DB dosyasını açıkça silip Excel’den yeniden kur')
args = parser.parse_args()

if args.vgm_only:
    if not os.path.exists(DB_PATH):
        raise SystemExit(f'Database not found: {DB_PATH}. Create it with the normal Excel import first.')
    connection = sqlite3.connect(DB_PATH)
    try:
        source_count, changed = import_vgm(connection, args.vgm_json)
        vgm_count = connection.execute("SELECT COUNT(*) FROM stks WHERE veri_kaynagi = 'VGM'").fetchone()[0]
        fts_count = connection.execute("SELECT COUNT(*) FROM stks_fts").fetchone()[0]
        total_count = connection.execute("SELECT COUNT(*) FROM stks").fetchone()[0]
        print(f'SUCCESS: {source_count} VGM records processed ({changed} database changes).')
        print(f'SUCCESS: {vgm_count} VGM / {total_count} total STKs; {fts_count} FTS rows.')
    finally:
        connection.close()
    raise SystemExit(0)

if os.path.exists(DB_PATH) and not args.reset:
    raise SystemExit('Database already exists. Use --vgm-only to migrate/import VGM or --reset to rebuild it.')

print(f"Reading {EXCEL_PATH}...")
df = pd.read_excel(EXCEL_PATH)
print(f"Loaded {len(df)} rows from Excel.")

# Plate code to city mapping for 81 Turkish provinces
PLATE_MAP = {
    '01': 'Adana', '02': 'Adıyaman', '03': 'Afyonkarahisar', '04': 'Ağrı', '05': 'Amasya',
    '06': 'Ankara', '07': 'Antalya', '08': 'Artvin', '09': 'Aydın', '10': 'Balıkesir',
    '11': 'Bilecik', '12': 'Bingöl', '13': 'Bitlis', '14': 'Bolu', '15': 'Burdur',
    '16': 'Bursa', '17': 'Çanakkale', '18': 'Çankırı', '19': 'Çorum', '20': 'Denizli',
    '21': 'Diyarbakır', '22': 'Edirne', '23': 'Elazığ', '24': 'Erzincan', '25': 'Erzurum',
    '26': 'Eskişehir', '27': 'Gaziantep', '28': 'Giresun', '29': 'Gümüşhane', '30': 'Hakkari',
    '31': 'Hatay', '32': 'Isparta', '33': 'Mersin', '34': 'İstanbul', '35': 'İzmir',
    '36': 'Kars', '37': 'Kastamonu', '38': 'Kayseri', '39': 'Kırklareli', '40': 'Kırşehir',
    '41': 'Kocaeli', '42': 'Konya', '43': 'Kütahya', '44': 'Malatya', '45': 'Manisa',
    '46': 'Kahramanmaraş', '47': 'Mardin', '48': 'Muğla', '49': 'Muş', '50': 'Nevşehir',
    '51': 'Niğde', '52': 'Ordu', '53': 'Rize', '54': 'Sakarya', '55': 'Samsun',
    '56': 'Siirt', '57': 'Sinop', '58': 'Sivas', '59': 'Tekirdağ', '60': 'Tokat',
    '61': 'Trabzon', '62': 'Tunceli', '63': 'Şanlıurfa', '64': 'Uşak', '65': 'Van',
    '66': 'Yozgat', '67': 'Zonguldak', '68': 'Aksaray', '69': 'Bayburt', '70': 'Karaman',
    '71': 'Kırıkkale', '72': 'Batman', '73': 'Şırnak', '74': 'Bartın', '75': 'Ardahan',
    '76': 'Iğdır', '77': 'Yalova', '78': 'Karabük', '79': 'Kilis', '80': 'Osmaniye',
    '81': 'Düzce'
}

def clean_text(val):
    if pd.isna(val) or val is None:
        return ''
    return str(val).strip()

def parse_city_district(row):
    kutuk = clean_text(row.get('Kütük No', ''))
    addr = clean_text(row.get('Kurum Adresi', ''))

    city = 'Belirtilmemiş'
    district = ''

    # 1. Try plate from Kutuk No (e.g. 34-123-456)
    if len(kutuk) >= 2 and kutuk[:2] in PLATE_MAP:
        city = PLATE_MAP[kutuk[:2]]

    # 2. Try parsing address (e.g. KADIKÖY/İSTANBUL/TURKIYE or MERKEZ/ANKARA)
    if addr:
        parts = addr.split('/')
        if len(parts) >= 3:
            d_candidate = parts[-3].strip()
            c_candidate = parts[-2].strip()
            if city == 'Belirtilmemiş':
                for code, cname in PLATE_MAP.items():
                    if cname.upper() in c_candidate.upper():
                        city = cname
                        break
            district = d_candidate
        elif len(parts) == 2:
            d_candidate = parts[0].strip()
            c_candidate = parts[1].strip()
            if city == 'Belirtilmemiş':
                for code, cname in PLATE_MAP.items():
                    if cname.upper() in c_candidate.upper():
                        city = cname
                        break
            district = d_candidate
        else:
            if city == 'Belirtilmemiş':
                addr_upper = addr.upper()
                for code, cname in PLATE_MAP.items():
                    if cname.upper() in addr_upper:
                        city = cname
                        break

    # Clean district if too long or containing noise
    if len(district) > 50:
        words = district.split()
        district = words[-1] if words else ''

    return city, district

def format_date(val):
    if pd.isna(val) or val is None:
        return ''
    if isinstance(val, (datetime.datetime, datetime.date, pd.Timestamp)):
        return val.strftime('%Y-%m-%d')
    return str(val)[:10]

def clean_url(val):
    url = clean_text(val)
    if not url:
        return ''
    if url.startswith('http://') or url.startswith('https://'):
        return url
    return f"https://{url}"

print("Connecting to SQLite database...")
if args.reset and os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Performance PRAGMAs
cursor.execute("PRAGMA journal_mode = WAL;")
cursor.execute("PRAGMA synchronous = NORMAL;")

print("Creating database schema...")
cursor.executescript("""
CREATE TABLE stks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sira_no INTEGER,
    faaliyet_alani TEXT,
    detayli_faaliyet TEXT,
    kurum_adi TEXT NOT NULL,
    kutuk_no TEXT,
    kurulus_tarihi TEXT,
    web_site TEXT,
    kurum_adresi TEXT,
    il TEXT,
    ilce TEXT,
    telefon TEXT,
    email TEXT,
    aciklama TEXT,
    is_verified INTEGER DEFAULT 0,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    kurum_turu TEXT NOT NULL DEFAULT 'dernek',
    veri_kaynagi TEXT NOT NULL DEFAULT 'DERBIS',
    kaynak_id TEXT,
    vakif_kategori_id INTEGER,
    hibe_veriyor INTEGER,
    faks TEXT
);

CREATE INDEX idx_stks_il ON stks(il);
CREATE INDEX idx_stks_faaliyet ON stks(faaliyet_alani);
CREATE INDEX idx_stks_kurum_adi ON stks(kurum_adi);
CREATE INDEX idx_stks_kutuk ON stks(kutuk_no);
CREATE UNIQUE INDEX idx_stks_source_id ON stks(veri_kaynagi, kaynak_id)
WHERE kaynak_id IS NOT NULL AND kaynak_id != '';

-- Full-Text Search (FTS5) for instant search
CREATE VIRTUAL TABLE stks_fts USING fts5(
    kurum_adi,
    faaliyet_alani,
    detayli_faaliyet,
    il,
    ilce,
    kurum_adresi,
    content='stks',
    content_rowid='id'
);

-- Triggers to keep FTS index updated
CREATE TRIGGER stks_ai AFTER INSERT ON stks BEGIN
  INSERT INTO stks_fts(rowid, kurum_adi, faaliyet_alani, detayli_faaliyet, il, ilce, kurum_adresi)
  VALUES (new.id, new.kurum_adi, new.faaliyet_alani, new.detayli_faaliyet, new.il, new.ilce, new.kurum_adresi);
END;

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    badge_color TEXT,
    description TEXT,
    stk_count INTEGER DEFAULT 0
);

CREATE TABLE support_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_group TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    target_groups TEXT, -- JSON array of suitable target groups
    search_keywords TEXT -- space separated keywords for FTS5 matching
);

CREATE TABLE stk_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stk_id INTEGER,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'stk_admin',
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(stk_id) REFERENCES stks(id)
);

CREATE TABLE stk_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stk_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT NOT NULL,
    event_date TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(stk_id) REFERENCES stks(id)
);

CREATE TABLE contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stk_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    support_category TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewed, answered
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(stk_id) REFERENCES stks(id)
);
""")

print("Transforming and inserting STK records...")
records_to_insert = []
categories_count = {}

for idx, row in df.iterrows():
    sira_no = int(row.get('Sıra No', idx + 1)) if pd.notna(row.get('Sıra No')) else idx + 1
    faaliyet = clean_text(row.get('Faaliyet Alanı', ''))
    detayli = clean_text(row.get('Detaylı Faaliyet Alanı', ''))
    kurum_adi = clean_text(row.get('Kurum Adı', ''))
    kutuk_no = clean_text(row.get('Kütük No', ''))
    kurulus = format_date(row.get('Kuruluş Tarihi'))
    web_site = clean_url(row.get('Web Site'))
    adres = clean_text(row.get('Kurum Adresi', ''))

    city, district = parse_city_district(row)

    if faaliyet:
        categories_count[faaliyet] = categories_count.get(faaliyet, 0) + 1

    records_to_insert.append((
        sira_no, faaliyet, detayli, kurum_adi, kutuk_no,
        kurulus, web_site, adres, city, district,
        '', '', '', 0, ''
    ))

print(f"Executing bulk insert of {len(records_to_insert)} records...")
cursor.executemany("""
INSERT INTO stks (
    sira_no, faaliyet_alani, detayli_faaliyet, kurum_adi, kutuk_no,
    kurulus_tarihi, web_site, kurum_adresi, il, ilce,
    telefon, email, aciklama, is_verified, logo_url
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", records_to_insert)

# Populate FTS5 table
print("Building FTS5 search index...")
cursor.execute("""
INSERT INTO stks_fts(rowid, kurum_adi, faaliyet_alani, detayli_faaliyet, il, ilce, kurum_adresi)
SELECT id, kurum_adi, faaliyet_alani, detayli_faaliyet, il, ilce, kurum_adresi FROM stks;
""")

# Insert categories
print("Inserting categories...")
CATEGORY_META = {
    'İNSANİ YARDIM DERNEKLERİ': {'icon': 'HandHeart', 'color': 'rose', 'desc': 'Temel ihtiyaç, gıda, erzak, kıyafet ve barınma destekleri'},
    'EĞİTİM ARAŞTIRMA  DERNEKLERİ': {'icon': 'GraduationCap', 'color': 'blue', 'desc': 'Burs, eğitim materyali, kurs, mentorluk ve okul destekleri'},
    'SAĞLIK ALANINDA FAALİYET GÖSTEREN DERNEKLER': {'icon': 'HeartPulse', 'color': 'red', 'desc': 'Medikal yardım, hasta dayanışması, tedavi ve ilaç destekleri'},
    'ENGELLİ DERNEKLERİ': {'icon': 'Accessibility', 'color': 'indigo', 'desc': 'Engelli bireyler ve aileleri için rehabilitasyon, medikal araç ve sosyal haklar'},
    'ÇEVRE DOĞAL HAYAT HAYVANLARI KORUMA DERNEKLERİ': {'icon': 'Trees', 'color': 'emerald', 'desc': 'Doğa koruma, sokak hayvanları besleme, tedavi ve sahiplendirme'},
    'ÇOCUK DERNEKLERİ': {'icon': 'Baby', 'color': 'amber', 'desc': 'Çocuk hakları, koruma, psikososyal destek ve gelişim projeleri'},
    'GENÇLİK DERNEKLERİ': {'icon': 'Sparkles', 'color': 'cyan', 'desc': 'Gençlik projeleri, spor, kariyer ve kişisel gelişim'},
    'HAK VE SAVUNUCULUK DERNEKLERİ': {'icon': 'Scale', 'color': 'purple', 'desc': 'Hukuki destek, insan hakları, kadın hakları ve adalete erişim'},
    'KÜLTÜR, SANAT ve TURİZM DERNEKLERİ': {'icon': 'Palette', 'color': 'fuchsia', 'desc': 'Sanatsal faaliyetler, kültürel miras ve atölye çalışmaları'},
    'MESLEKİ ve DAYANIŞMA DERNEKLERİ': {'icon': 'Briefcase', 'color': 'slate', 'desc': 'Meslek dayanışması, esnaf ve sektörel yardımlaşma'},
    'SPOR ve SPOR İLE İLGİLİ DERNEKLERİ': {'icon': 'Trophy', 'color': 'orange', 'desc': 'Spor kulüpleri, sporcu destekleri ve gençlik etkinlikleri'},
    'DİNİ HİZMETLERİN GERÇEKLEŞTİRİLMESİNE YÖNELİK FAALİYET GÖSTEREN DERNEKLER': {'icon': 'Building2', 'color': 'teal', 'desc': 'Dini tesis, cami ve ibadethane yaşatma faaliyetleri'},
    'TOPLUMSAL DEĞERLERİ YAŞATMA DERNEKLERİ': {'icon': 'ShieldCheck', 'color': 'emerald', 'desc': 'Gelenek, görenek ve kültürel değerlerin korunması'},
    'BİREYSEL ÖĞRETİ VE TOPLUMSAL GELİŞİM DERNEKLERİ': {'icon': 'BookOpen', 'color': 'sky', 'desc': 'Kişisel gelişim, seminer ve bilinçlendirme çalışmaları'},
    'İMAR, ŞEHİRCİLİK VE KALKINDIRMA DERNEKLERİ': {'icon': 'Building', 'color': 'stone', 'desc': 'Kentsel gelişim ve bölgesel kalkınma projeleri'},
    'DÜŞÜNCE TEMELLİ DERNEKLER': {'icon': 'Lightbulb', 'color': 'violet', 'desc': 'Fikir, düşünce ve stratejik araştırma merkezleri'},
    'KAMU KURUMLARI ve PERSONELİNİ DESTEKLEYEN DERNEKLER': {'icon': 'Landmark', 'color': 'gray', 'desc': 'Kamu hizmetlerini ve personelini destekleme dernekleri'},
    'DIŞ TÜRKLER İLE DAYANIŞMA DERNEKLERİ': {'icon': 'Globe', 'color': 'blue', 'desc': 'Yurtdışı Türkler ve akraba topluluklar dayanışması'},
    'GIDA, TARIM ve HAYVANCILIK ALANINDA FAALİYET GÖSTEREN DERNEKLER': {'icon': 'Wheat', 'color': 'lime', 'desc': 'Tarım, çiftçi destekleri ve hayvancılık geliştirme'},
    'ULUSLAR ARASI TEŞEKKÜLLER VE İŞBİRLİĞİ DERNEKLERİ': {'icon': 'Network', 'color': 'cyan', 'desc': 'Uluslararası sivil toplum işbirlikleri ve diplomasisi'},
    'ŞEHİT YAKINI VE GAZİ DERNEKLERİ': {'icon': 'Medal', 'color': 'rose', 'desc': 'Şehit aileleri ve gazilerimiz için dayanışma ve hak savunuculuğu'},
    'YAŞLI ve ÇOCUKLARA YÖNELİK DERNEKLER': {'icon': 'HeartHandshake', 'color': 'pink', 'desc': 'Huzurevi, bakıma muhtaç yaşlı ve kimsesiz çocuk destekleri'}
}

category_rows = []
for cat_name, count in categories_count.items():
    meta = CATEGORY_META.get(cat_name, {'icon': 'Building', 'color': 'blue', 'desc': 'Sivil toplum ve dayanışma faaliyetleri'})
    category_rows.append((cat_name, meta['icon'], meta['color'], meta['desc'], count))

cursor.executemany("""
INSERT INTO categories (name, icon, badge_color, description, stk_count)
VALUES (?, ?, ?, ?, ?)
""", category_rows)

# Insert predefined Smart Wizard support topics
print("Inserting smart wizard topics...")
wizard_topics = [
    (
        "Burs ve Eğitim Desteği",
        "Eğitim & Öğretim",
        "GraduationCap",
        "İlkokul, lise, üniversite öğrencileri için karşılıksız burs, kırtasiye, yurt ve eğitim materyali destekleri.",
        '["Öğrenci", "Üniversite Öğrencisi", "Yoksul Aile", "Yetim/Öksüz"]',
        "Burs eğitim öğrenci yurt kırtasiye okul dershane lisans yüksek lisans akademik"
    ),
    (
        "Gıda, Erzak ve Temel İhtiyaç Yardımı",
        "Temel İhtiyaç & İnsani Yardım",
        "HandHeart",
        "Düzenli erzak kolisi, sıcak yemek, market kartı, giysi ve barınma yardımları.",
        '["İhtiyaç Sahibi Aile", "Afetzede", "İşsiz / Geliri Olmayan", "Mülteci / Sığınmacı"]',
        "Gıda erzak aşevi koli giyim barınma insani yardım sıcak yemek market kartı yoksul"
    ),
    (
        "Afet, Acil Durum ve Arama Kurtarma",
        "Afet & Acil Durum",
        "Flame",
        "Deprem, sel, yangın gibi afetlerde arama-kurtarma, ilk yardım, çadır/konteyner ve tahliye destekleri.",
        '["Afetzede", "Genel Vatandaş", "Gönüllü Olmak İsteyen"]',
        "Afet deprem arama kurtarma yangın sel ilk yardım çadır acil lojistik tahliye"
    ),
    (
        "Sağlık, Tedavi ve Medikal Cihaz Desteği",
        "Sağlık & Tedavi",
        "HeartPulse",
        "Kanser, nadir hastalıklar, SMA, ameliyat masrafları, tekerlekli sandalye, protez ve ilaç temini.",
        '["Hasta Birey", "Hasta Yakını", "Engelli Birey", "Yaşlı Birey"]',
        "Sağlık tedavi ilaç ameliyat kanser lösemi sma medikal protez tekerlekli sandalye hasta"
    ),
    (
        "Engelli Birey ve Aile Hizmetleri",
        "Engelli Destek",
        "Accessibility",
        "Fiziksel, zihinsel, görme ve işitme engelliler için özel eğitim, rehabilitasyon, istihdam ve araç desteği.",
        '["Engelli Birey", "Engelli Yakını / Ailesi"]',
        "Engelli otizm down sendromu görme engelli işitme fiziksel rehabilitasyon medikal araç erişilebilirlik"
    ),
    (
        "Hukuki Destek ve Hak Arama",
        "Hukuk & Adalet",
        "Scale",
        "Kadın hakları, şiddet mağdurları, tüketici hakları, çocuk istismarı ve mülkiyet uyuşmazlıklarında ücretsiz danışmanlık.",
        '["Kadın", "Şiddet Mağduru", "Çocuk / Aile", "Genel Vatandaş"]',
        "Hukuk avukat adli yardım kadın hakları şiddet istismar insan hakları danışmanlık mahkeme"
    ),
    (
        "Psikolojik ve Sosyal Destek",
        "Ruh Sağlığı & Danışmanlık",
        "Brain",
        "Travma, yas, bağımlılık, aile danışmanlığı ve psikososyal rehabilitasyon seansları.",
        '["Bireysel", "Aile", "Bağımlı / Bağımlı Yakını", "Travma Yaşayan"]',
        "Psikolog terapi ruh sağlığı bağımlılık danışmanlık aile terapi rehabilitasyon travma yas"
    ),
    (
        "Sokak Hayvanları ve Çevre Desteği",
        "Hayvan & Doğa Koruma",
        "Trees",
        "Yaralı sokak hayvanı tedavisi, mama desteği, sahiplendirme, fidan dikimi ve çevre kirliliği mücadeleleri.",
        '["Hayvansever / Gönüllü", "Vatandaş"]',
        "Hayvan sokak hayvanı kedi köpek veteriner mama barınak sahiplendirme ağaçlandırma doğa çevre"
    ),
    (
        "Yaşlı ve Kimsesiz Bakım Desteği",
        "Yaşlı & Bakım",
        "HeartHandshake",
        "Evde bakım, sıcak yemek servisi, yalnız yaşayan yaşlılara refakat ve huzurevi yönlendirme.",
        '["Yaşlı Birey", "Yaşlı Yakını", "Kimsesiz"]',
        "Yaşlı huzurevi evde bakım refakat kimsesiz geriatri emekli dayanışma"
    ),
    (
        "Girişimcilik, İstihdam ve Mesleki Eğitim",
        "Kariyer & İstihdam",
        "Briefcase",
        "Kadın ve genç girişimciler için hibe rehberliği, meslek edindirme kursları ve iş bulma mentörlüğü.",
        '["Genç", "Kadın Girişimci", "İş Arayan"]',
        "İstihdam iş meslek kurs eğitim kadın kooperatif girişimcilik hibe mentörlük kariyer"
    )
]

cursor.executemany("""
INSERT INTO support_topics (title, category_group, icon, description, target_groups, search_keywords)
VALUES (?, ?, ?, ?, ?, ?)
""", wizard_topics)

# Sample STK admin user and showcase STK activities
print("Adding sample verified demo showcase STKs with rich profiles...")
cursor.execute("""
UPDATE stks SET
    is_verified = 1,
    telefon = '0 (212) 444 00 00',
    email = 'iletisim@stkplatformu.org.tr',
    aciklama = 'Toplumsal fayda, insan hakları ve sürdürülebilir dayanışma için Türkiye genelinde aktif çalışmalar yürüten öncü sivil toplum kuruluşu.'
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
""")

# Insert sample activities for verified STKs
cursor.executescript("""
INSERT INTO stk_activities (stk_id, title, category, content, event_date)
VALUES
(1, '2026-2027 Öğrenim Dönemi Üniversite Burs Başvuruları Başladı', 'Burs & Eğitim', 'Tüm Türkiye genelinde maddi desteğe ihtiyaç duyan başarılı 500 lisans ve önlisans öğrencisine aylık karşılıksız burs desteği sağlanacaktır.', '2026-09-01'),
(1, 'Kışlık Yakacak ve Erzak Dağıtımı Kampanyası', 'İnsani Yardım', 'Doğu Anadolu ve Güneydoğu illerimizdeki 1.200 haneye kömür, soba ve temel erzak kolisi ulaştırılmıştır.', '2026-08-15'),
(2, 'Afet Farkındalık ve Temel İlk Yardım Semineri', 'Eğitim & Afet', 'Vatandaşlarımızın deprem ve doğal afetlere hazırlıklı olması için Kadıköy merkezimizde ücretsiz 2 günlük sertifikalı ilk yardım eğitimi düzenlenmektedir.', '2026-09-10'),
(3, 'Sokak Hayvanları İçin Mobil Kısırlaştırma ve Tedavi Tırı', 'Hayvan Hakları', 'Kırsal bölgelerde sahipsiz kedi ve köpeklerin aşılanması, kısırlaştırılması ve mikroçip takılması amacıyla mobil veteriner aracımız göreve başladı.', '2026-08-20');
""")

conn.commit()

if os.path.exists(args.vgm_json):
    print(f"Importing VGM foundations from {args.vgm_json}...")
    imported_vgm, _ = import_vgm(conn, args.vgm_json)
    print(f"SUCCESS: {imported_vgm} VGM foundations imported.")
else:
    print(f"WARNING: VGM JSON not found at {args.vgm_json}; continuing with associations only.")

print("Verifying database insertion count...")
count = cursor.execute("SELECT COUNT(*) FROM stks").fetchone()[0]
fts_count = cursor.execute("SELECT COUNT(*) FROM stks_fts").fetchone()[0]
cat_count = cursor.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
topic_count = cursor.execute("SELECT COUNT(*) FROM support_topics").fetchone()[0]

print(f"SUCCESS: {count} STKs imported into main table.")
print(f"SUCCESS: {fts_count} STKs indexed in FTS5 search table.")
print(f"SUCCESS: {cat_count} categories created.")
print(f"SUCCESS: {topic_count} smart wizard support topics created.")

conn.close()
print(f"Database ready at: {DB_PATH}")
