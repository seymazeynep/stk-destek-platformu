import hashlib
import sqlite3
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

SERVER_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_DIR))

import app as backend


@pytest.fixture
def db():
    connection = sqlite3.connect(":memory:", check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE stks (
            id INTEGER PRIMARY KEY, sira_no INTEGER, faaliyet_alani TEXT,
            detayli_faaliyet TEXT, kurum_adi TEXT NOT NULL, kutuk_no TEXT,
            kurulus_tarihi TEXT, web_site TEXT DEFAULT '', kurum_adresi TEXT,
            il TEXT, ilce TEXT, telefon TEXT, email TEXT, aciklama TEXT,
            is_verified INTEGER DEFAULT 0, logo_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, kurum_turu TEXT NOT NULL,
            veri_kaynagi TEXT NOT NULL, kaynak_id TEXT, vakif_kategori_id INTEGER,
            hibe_veriyor INTEGER, faks TEXT
        );
        CREATE VIRTUAL TABLE stks_fts USING fts5(
            kurum_adi, faaliyet_alani, detayli_faaliyet, il, ilce, kurum_adresi,
            content='stks', content_rowid='id'
        );
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY, name TEXT, icon TEXT, badge_color TEXT,
            stk_count INTEGER, description TEXT
        );
        CREATE TABLE stk_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, stk_id INTEGER, email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL, contact_name TEXT, phone TEXT,
            role TEXT DEFAULT 'stk_admin', is_approved INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stk_id) REFERENCES stks(id)
        );
        CREATE TABLE stk_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT, stk_id INTEGER NOT NULL,
            title TEXT NOT NULL, category TEXT, content TEXT NOT NULL,
            event_date TEXT, image_url TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stk_id) REFERENCES stks(id)
        );
        CREATE TABLE contact_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT, stk_id INTEGER NOT NULL,
            user_name TEXT NOT NULL, user_email TEXT NOT NULL, user_phone TEXT,
            support_category TEXT, subject TEXT NOT NULL, message TEXT NOT NULL,
            status TEXT DEFAULT 'pending', admin_notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stk_id) REFERENCES stks(id)
        );
        CREATE TABLE support_topics (
            id INTEGER PRIMARY KEY, title TEXT, category_group TEXT, icon TEXT,
            description TEXT, target_groups TEXT, search_keywords TEXT
        );
        INSERT INTO stks (
            id, faaliyet_alani, detayli_faaliyet, kurum_adi, kutuk_no, web_site,
            kurum_adresi, il, ilce, telefon, email, is_verified, kurum_turu,
            veri_kaynagi, kaynak_id, vakif_kategori_id, hibe_veriyor, faks
        ) VALUES
            (1, 'Eğitim', 'Burs eğitim öğrenci', 'Örnek Dernek', '34-1', '',
             'Adres 1', 'İstanbul', 'Kadıköy', '111', 'd@example.org', 1,
             'dernek', 'DERBIS', NULL, NULL, NULL, ''),
            (2, 'Vakıf', 'Burs eğitim öğrenci', 'Örnek Eğitim Vakfı', 'V-2', '',
             'Adres 2', 'İstanbul', 'Beşiktaş', '222', 'v@example.org', 0,
             'vakif', 'VGM', '2', 5, 1, '333');
        INSERT INTO stks_fts(stks_fts) VALUES('rebuild');
        INSERT INTO categories VALUES (1, 'Eğitim', 'Book', 'blue', 1, 'Eğitim');
        INSERT INTO support_topics VALUES (
            1, 'Burs Desteği', 'Eğitim', 'Book', 'Burs', '[]', 'Burs eğitim öğrenci'
        );
        INSERT INTO contact_requests
            (id, stk_id, user_name, user_email, subject, message)
        VALUES (1, 1, 'A', 'a@example.org', 'Konu', 'Mesaj'),
               (2, 2, 'B', 'b@example.org', 'Konu', 'Mesaj');
    """)
    yield connection
    connection.close()


@pytest.fixture
def client(db):
    def override_db():
        yield db

    backend.app.dependency_overrides[backend.get_db] = override_db
    backend._RATE_BUCKETS.clear()
    with TestClient(backend.app) as test_client:
        yield test_client
    backend.app.dependency_overrides.clear()
    backend._RATE_BUCKETS.clear()


def add_user(db, *, email="admin@example.org", password="strong-password", stk_id=1,
             role="stk_admin", approved=1, legacy=False):
    if legacy:
        salt = "legacy-salt"
        key = hashlib.pbkdf2_hmac("sha512", password.encode(), salt.encode(), 1000).hex()
        password_hash = f"{salt}:{key}"
    else:
        password_hash = backend.hash_password(password)
    cursor = db.execute(
        "INSERT INTO stk_users (stk_id, email, password_hash, contact_name, phone, role, is_approved) "
        "VALUES (?, ?, ?, 'Yönetici', '', ?, ?)",
        (stk_id, email, password_hash, role, approved),
    )
    db.commit()
    return cursor.lastrowid


def login(client, email="admin@example.org", password="strong-password"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_stks_filters_and_public_fields_remain_stable(db):
    response = backend.get_stks(page=1, limit=18, organizationType="vakif", db=db)
    assert response["total"] == 1
    listed = backend.get_stks(page=1, limit=18, db=db)["stks"][0]
    searched = backend.get_stks(page=1, limit=18, q="Örnek", db=db)["stks"][0]
    assert set(searched) == set(listed)
    assert {"kurum_turu", "veri_kaynagi", "kaynak_id", "vakif_kategori_id", "hibe_veriyor", "faks"} <= set(searched)


def test_vakif_filter_ignores_derbis_category(db):
    response = backend.get_stks(page=1, limit=18, organizationType="vakif", category="Eğitim", db=db)
    assert response["total"] == 1


def test_stats_and_wizard_preserve_organization_types(db):
    stats = backend.get_stats(db=db)
    assert {item["organizationType"]: item["count"] for item in stats["organizationTypeDistribution"]} == {"dernek": 1, "vakif": 1}
    wizard = backend.match_wizard(topicId=1, db=db)
    assert wizard["count"] == 2
    assert all("kurum_turu" in stk and "veri_kaynagi" in stk for stk in wizard["stks"])


def test_register_does_not_claim_or_verify_client_selected_stk(client, db):
    response = client.post("/api/auth/register", json={
        "email": " NEW@example.org ", "password": "a-secure-password",
        "contact_name": " Yeni Kullanıcı ", "stk_id": 2,
        "kutuk_no": "V-2", "kurum_adi": "Örnek Eğitim Vakfı",
    })
    assert response.status_code == 201
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    assert "token" not in response.json()
    user = db.execute("SELECT * FROM stk_users WHERE email = 'new@example.org'").fetchone()
    assert user["stk_id"] is None
    assert user["role"] == "pending"
    assert user["is_approved"] == 0
    assert db.execute("SELECT is_verified FROM stks WHERE id = 2").fetchone()[0] == 0


def test_legacy_password_login_rehashes_and_cookie_auth_works(client, db):
    add_user(db, legacy=True)
    response = login(client)
    assert response.status_code == 200
    assert "token" not in response.json()
    upgraded = db.execute("SELECT password_hash FROM stk_users WHERE email = 'admin@example.org'").fetchone()[0]
    assert upgraded.startswith(f"pbkdf2_sha256${backend.PBKDF2_ITERATIONS}$")
    assert client.get("/api/stk/dashboard").status_code == 200
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/stk/dashboard").status_code == 401


def test_request_update_enforces_stk_ownership_and_rowcount(client, db):
    add_user(db)
    assert login(client).status_code == 200
    denied = client.patch("/api/stk/requests/2", json={"status": "answered"})
    assert denied.status_code == 404
    assert db.execute("SELECT status FROM contact_requests WHERE id = 2").fetchone()[0] == "pending"
    allowed = client.patch("/api/stk/requests/1", json={"status": "reviewed"})
    assert allowed.status_code == 200
    assert db.execute("SELECT status FROM contact_requests WHERE id = 1").fetchone()[0] == "reviewed"


def test_unapproved_user_cannot_write_or_see_stk_data(client, db):
    add_user(db, stk_id=1, role="pending", approved=0)
    assert login(client).status_code == 200
    dashboard = client.get("/api/stk/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["stk"] is None
    assert dashboard.json()["requests"] == []
    assert client.patch("/api/stk/requests/1", json={"status": "answered"}).status_code == 403


def test_dashboard_without_stk_never_lists_global_requests(client, db):
    add_user(db, stk_id=None, role="stk_admin", approved=1)
    assert login(client).status_code == 200
    assert client.get("/api/stk/dashboard").json()["requests"] == []


def test_validation_forbids_extra_fields_and_unsafe_urls(client, db):
    add_user(db)
    assert login(client).status_code == 200
    assert client.put("/api/stk/profile", json={"web_site": "javascript:alert(1)"}).status_code == 422
    assert client.patch("/api/stk/requests/1", json={"status": "deleted"}).status_code == 422
    invalid_contact = client.post("/api/contact", json={
        "stk_id": 1, "user_name": "Test", "user_email": "not-an-email",
        "subject": "Konu", "message": "Yeterli mesaj", "unexpected": True,
    })
    assert invalid_contact.status_code == 422


def test_rate_limit_returns_retry_after(client):
    payload = {"email": "missing@example.org", "password": "wrong"}
    for _ in range(backend._RATE_LIMITS["login"][0]):
        assert client.post("/api/auth/login", json=payload).status_code == 400
    limited = client.post("/api/auth/login", json=payload)
    assert limited.status_code == 429
    assert int(limited.headers["retry-after"]) >= 1


def test_unknown_api_is_json_404_and_security_headers_present(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json()["detail"] == "API endpoint bulunamadı."
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_cors_rejects_unlisted_origin_and_allows_localhost(client):
    rejected = client.options("/api/health", headers={
        "Origin": "https://evil.example", "Access-Control-Request-Method": "GET",
    })
    assert "access-control-allow-origin" not in rejected.headers
    allowed = client.options("/api/health", headers={
        "Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET",
    })
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert allowed.headers["access-control-allow-credentials"] == "true"
