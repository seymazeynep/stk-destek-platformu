import os
import json
import sqlite3
import hashlib
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal, Optional, List
from urllib.parse import urlparse

import jwt
from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'data', 'stk.db')
JWT_ALGORITHM = 'HS256'
JWT_COOKIE_NAME = "access_token"
PBKDF2_ITERATIONS = 600_000


def _load_jwt_secret() -> str:
    configured = os.getenv("JWT_SECRET")
    if configured:
        return configured

    secret_path = Path(BASE_DIR) / "data" / ".jwt_secret"
    secret_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        return secret_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        generated = secrets.token_urlsafe(64)
        try:
            fd = os.open(secret_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as secret_file:
                secret_file.write(generated)
            try:
                os.chmod(secret_path, 0o600)
            except OSError:
                pass
            return generated
        except FileExistsError:
            return secret_path.read_text(encoding="utf-8").strip()


JWT_SECRET = _load_jwt_secret()


def _env_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173")
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]

STK_PUBLIC_FIELDS = """
    s.id, s.sira_no, s.faaliyet_alani, s.detayli_faaliyet, s.kurum_adi,
    s.kutuk_no, s.kurulus_tarihi, s.web_site, s.kurum_adresi, s.il, s.ilce,
    s.telefon, s.email, s.aciklama, s.is_verified, s.logo_url, s.created_at,
    s.kurum_turu, s.veri_kaynagi, s.kaynak_id, s.vakif_kategori_id,
    s.hibe_veriyor, s.faks
"""

app = FastAPI(
    title="STK Platformu API",
    description="Türkiye STK Destek ve Dayanışma Platformu Yüksek Performanslı REST API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https: http:; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    return response

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    # High-performance pragmas
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    try:
        yield conn
    finally:
        conn.close()

# Password hashing utilities. The versioned format permits future upgrades.
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        if stored_hash.startswith("pbkdf2_sha256$"):
            _, iterations, salt, key = stored_hash.split("$", 3)
            test_key = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
            )
            return secrets.compare_digest(test_key.hex(), key)

        # Legacy compatibility: salt:key used PBKDF2-SHA512 with 1,000 rounds.
        salt, key = stored_hash.split(":", 1)
        test_key = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt.encode("utf-8"), 1000)
        return secrets.compare_digest(test_key.hex(), key)
    except (TypeError, ValueError):
        return False


def password_needs_rehash(stored_hash: str) -> bool:
    try:
        scheme, iterations, _, _ = stored_hash.split("$", 3)
        return scheme != "pbkdf2_sha256" or int(iterations) < PBKDF2_ITERATIONS
    except (AttributeError, TypeError, ValueError):
        return True

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None, alias=JWT_COOKIE_NAME),
    db: sqlite3.Connection = Depends(get_db),
):
    token = access_token
    if authorization:
        scheme, _, value = authorization.partition(" ")
        if scheme.lower() == "bearer" and value:
            token = value
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Yetkilendirme tokenı gerekli.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('id')
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz token.")
        user = db.execute("SELECT * FROM stk_users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı bulunamadı.")
        return dict(user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz veya süresi dolmuş token.")


def require_approved_stk_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "stk_admin" or current_user.get("is_approved") != 1 or not current_user.get("stk_id"):
        raise HTTPException(status_code=403, detail="Bu işlem için onaylı bir STK yöneticisi hesabı gereklidir.")
    return current_user


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        JWT_COOKIE_NAME,
        token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


_RATE_BUCKETS: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_RATE_LOCK = threading.Lock()
_RATE_LIMITS = {"login": (5, 60), "register": (3, 60), "contact": (10, 60)}


def rate_limit(scope: str):
    def check(request: Request) -> None:
        limit, window = _RATE_LIMITS[scope]
        client = request.client.host if request.client else "testclient"
        key = (scope, client)
        now = time.monotonic()
        with _RATE_LOCK:
            bucket = _RATE_BUCKETS[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, int(window - (now - bucket[0])) + 1)
                raise HTTPException(429, "Çok fazla istek gönderildi.", headers={"Retry-After": str(retry_after)})
            bucket.append(now)
    return check


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ContactRequestModel(StrictModel):
    stk_id: int = Field(gt=0)
    user_name: str = Field(min_length=2, max_length=120)
    user_email: EmailStr
    user_phone: Optional[str] = Field(default="", max_length=30)
    support_category: str = Field(default="Genel Destek", min_length=1, max_length=80)
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=5000)


class RegisterModel(StrictModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)
    contact_name: str = Field(min_length=2, max_length=120)
    phone: Optional[str] = Field(default="", max_length=30)
    # Retained for frontend compatibility, but never trusted for ownership.
    stk_id: Optional[int] = None
    kutuk_no: Optional[str] = Field(default=None, max_length=100)
    kurum_adi: Optional[str] = Field(default=None, max_length=300)


class LoginModel(StrictModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


def validate_http_url(value: Optional[str]) -> Optional[str]:
    if value in (None, ""):
        return value
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Geçerli bir http/https URL adresi olmalıdır")
    return value


class ProfileUpdateModel(StrictModel):
    telefon: Optional[str] = Field(default=None, max_length=30)
    email: Optional[EmailStr] = None
    web_site: Optional[str] = Field(default=None, max_length=2048)
    kurum_adresi: Optional[str] = Field(default=None, max_length=1000)
    aciklama: Optional[str] = Field(default=None, max_length=10000)
    logo_url: Optional[str] = Field(default=None, max_length=2048)

    _validate_web_site = field_validator("web_site")(validate_http_url)
    _validate_logo_url = field_validator("logo_url")(validate_http_url)


class ActivityCreateModel(StrictModel):
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(default="Duyuru", min_length=1, max_length=80)
    content: str = Field(min_length=2, max_length=10000)
    event_date: Optional[str] = Field(default="", max_length=40)
    image_url: Optional[str] = Field(default="", max_length=2048)

    _validate_image_url = field_validator("image_url")(validate_http_url)


class StatusUpdateModel(StrictModel):
    status: Optional[Literal["pending", "reviewed", "answered"]] = None
    admin_notes: Optional[str] = Field(default=None, max_length=5000)

# ==========================================
# 1. HEALTH & STATISTICS
# ==========================================
@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/stats")
def get_stats(db: sqlite3.Connection = Depends(get_db)):
    total_stks = db.execute("SELECT COUNT(*) as count FROM stks").fetchone()["count"]
    verified_stks = db.execute("SELECT COUNT(*) as count FROM stks WHERE is_verified = 1").fetchone()["count"]
    total_categories = db.execute("SELECT COUNT(*) as count FROM categories").fetchone()["count"]
    total_activities = db.execute("SELECT COUNT(*) as count FROM stk_activities").fetchone()["count"]
    total_requests = db.execute("SELECT COUNT(*) as count FROM contact_requests").fetchone()["count"]

    top_cities = [dict(r) for r in db.execute("""
        SELECT il, COUNT(*) as count
        FROM stks
        WHERE il != 'Belirtilmemiş'
        GROUP BY il
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()]

    category_dist = [dict(r) for r in db.execute("""
        SELECT name, icon, badge_color, stk_count, description
        FROM categories
        ORDER BY stk_count DESC
        LIMIT 8
    """).fetchall()]

    organization_type_dist = [dict(r) for r in db.execute("""
        SELECT kurum_turu AS organizationType, COUNT(*) AS count
        FROM stks
        GROUP BY kurum_turu
        ORDER BY count DESC
    """).fetchall()]

    return {
        "totalStks": total_stks,
        "verifiedStks": verified_stks,
        "totalCategories": total_categories,
        "totalActivities": total_activities,
        "totalRequests": total_requests,
        "topCities": top_cities,
        "categoryDistribution": category_dist,
        "organizationTypeDistribution": organization_type_dist
    }

# ==========================================
# 2. CATEGORIES & CITIES
# ==========================================
@app.get("/api/categories")
def get_categories(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM categories ORDER BY stk_count DESC").fetchall()
    return [dict(r) for r in rows]

@app.get("/api/cities")
def get_cities(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("""
        SELECT il, COUNT(*) as count
        FROM stks
        WHERE il != 'Belirtilmemiş'
        GROUP BY il
        ORDER BY il ASC
    """).fetchall()
    return [dict(r) for r in rows]

# ==========================================
# 3. SMART WIZARD (AKILLI DESTEK REHBERİ)
# ==========================================
@app.get("/api/wizard/topics")
def get_wizard_topics(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM support_topics ORDER BY id ASC").fetchall()
    res = []
    for r in rows:
        d = dict(r)
        d["target_groups"] = json.loads(d.get("target_groups") or "[]")
        res.append(d)
    return res

@app.get("/api/wizard/match")
def match_wizard(
    topicId: Optional[int] = None,
    targetGroup: Optional[str] = None,
    city: Optional[str] = None,
    keyword: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    topic = None
    if topicId:
        topic_row = db.execute("SELECT * FROM support_topics WHERE id = ?", (topicId,)).fetchone()
        if topic_row:
            topic = dict(topic_row)

    fts_terms = []
    if topic and topic.get("search_keywords"):
        words = [w for w in topic["search_keywords"].split() if len(w) > 2][:8]
        if words:
            fts_terms.append(f"({' OR '.join(words)})")

    if keyword and keyword.strip():
        clean_kw = "".join(c for c in keyword.strip() if c.isalnum() or c in " ğüşıöçĞÜŞİÖÇ")
        if clean_kw:
            fts_terms.append(f'"{clean_kw}"')

    where_conditions = []
    params = []

    if city and city not in ["Tüm Türkiye", "all", ""]:
        where_conditions.append("s.il = ?")
        params.append(city)

    fts_query = " AND ".join(fts_terms)
    results = []

    if fts_query:
        base_sql = """
            SELECT s.id, s.kurum_adi, s.faaliyet_alani, s.detayli_faaliyet, s.il, s.ilce,
                   s.telefon, s.email, s.web_site, s.kurum_adresi, s.aciklama, s.is_verified, s.logo_url,
                   s.kurum_turu, s.veri_kaynagi, s.kaynak_id, s.vakif_kategori_id, s.hibe_veriyor, s.faks
            FROM stks_fts f
            JOIN stks s ON s.id = f.rowid
        """
        where_conditions.append("stks_fts MATCH ?")
        params.append(fts_query)
    else:
        base_sql = """
            SELECT s.id, s.kurum_adi, s.faaliyet_alani, s.detayli_faaliyet, s.il, s.ilce,
                   s.telefon, s.email, s.web_site, s.kurum_adresi, s.aciklama, s.is_verified, s.logo_url,
                   s.kurum_turu, s.veri_kaynagi, s.kaynak_id, s.vakif_kategori_id, s.hibe_veriyor, s.faks
            FROM stks s
        """

    if where_conditions:
        base_sql += " WHERE " + " AND ".join(where_conditions)

    base_sql += " ORDER BY s.is_verified DESC, s.web_site != '' DESC LIMIT 30"

    try:
        rows = db.execute(base_sql, params).fetchall()
        results = [dict(r) for r in rows]
    except Exception as e:
        print("FTS match fallback:", e)
        fallback_sql = """
            SELECT id, kurum_adi, faaliyet_alani, detayli_faaliyet, il, ilce,
                   telefon, email, web_site, kurum_adresi, aciklama, is_verified, logo_url,
                   kurum_turu, veri_kaynagi, kaynak_id, vakif_kategori_id, hibe_veriyor, faks
            FROM stks
            WHERE 1=1
        """
        fb_params = []
        if topic:
            fallback_sql += " AND (faaliyet_alani LIKE ? OR detayli_faaliyet LIKE ?)"
            fb_params.extend([f"%{topic['title'][:6]}%", f"%{topic['category_group'][:6]}%"])
        if city and city not in ["Tüm Türkiye", "all", ""]:
            fallback_sql += " AND il = ?"
            fb_params.append(city)
        fallback_sql += " ORDER BY is_verified DESC LIMIT 30"
        rows = db.execute(fallback_sql, fb_params).fetchall()
        results = [dict(r) for r in rows]

    # Enhance results with scoring & recommendations
    enhanced = []
    for idx, stk in enumerate(results):
        score = max(75, 98 - (idx * 2))
        if stk["is_verified"]:
            score = min(100, score + 5)

        channels = ["Platform Üzerinden Mesaj"]
        if stk.get("telefon"):
            channels.insert(0, "Telefonla Görüşme")
        if stk.get("email"):
            channels.append("E-Posta")
        if stk.get("web_site"):
            channels.append("Resmi Web Başvurusu")

        enhanced.append({
            **stk,
            "matchScore": f"%{score}",
            "matchBadge": "Resmi Doğrulanmış & Doğrudan Destek" if stk["is_verified"] else "Faaliyet Alanı Uyumu Yüksek",
            "recommendedChannels": channels
        })

    return {
        "topic": topic["title"] if topic else "Genel Destek",
        "targetGroup": targetGroup or "Tüm Vatandaşlar",
        "city": city or "Tüm Türkiye",
        "count": len(enhanced),
        "stks": enhanced
    }

# ==========================================
# 4. STK DIRECTORY & SEARCH (PAGINATED)
# ==========================================
@app.get("/api/stks")
def get_stks(
    page: int = Query(1, ge=1),
    limit: int = Query(18, ge=1, le=100),
    q: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    organizationType: Optional[str] = None,
    verified: Optional[str] = None,
    sort: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    offset = (page - 1) * limit
    where_conditions = []
    params = []

    if city and city not in ["all", "Tüm İller", ""]:
        where_conditions.append("s.il = ?")
        params.append(city)

    normalized_type = None
    if organizationType and organizationType not in ["all", "Tüm Türler", ""]:
        normalized_type = organizationType.strip().lower()
        if normalized_type not in {"dernek", "vakif"}:
            raise HTTPException(status_code=422, detail="organizationType dernek veya vakif olmalıdır.")
        where_conditions.append("s.kurum_turu = ?")
        params.append(normalized_type)

    # DERBİS faaliyet kategorileri vakıflar için geçerli değildir. Eski veya
    # önbellekte kalmış istemciler uyumsuz bir kategori gönderirse yok say.
    if category and category not in ["all", "Tüm Kategoriler", ""]:
        if normalized_type != "vakif" or category == "Vakıf":
            where_conditions.append("s.faaliyet_alani = ?")
            params.append(category)

    if verified in ["true", "1"]:
        where_conditions.append("s.is_verified = 1")

    if q and q.strip():
        clean_q = "".join(c for c in q.strip() if c.isalnum() or c in " ğüşıöçĞÜŞİÖÇ")
        if clean_q:
            tokens = [f"{t}*" for t in clean_q.split() if t]
            fts_match_str = " ".join(tokens)
            select_sql = f"""
                SELECT {STK_PUBLIC_FIELDS}
                FROM stks_fts f
                JOIN stks s ON s.id = f.rowid
            """
            count_sql = """
                SELECT COUNT(*) as total
                FROM stks_fts f
                JOIN stks s ON s.id = f.rowid
            """
            where_conditions.append("stks_fts MATCH ?")
            params.append(fts_match_str)
        else:
            select_sql = f"SELECT {STK_PUBLIC_FIELDS} FROM stks s"
            count_sql = "SELECT COUNT(*) as total FROM stks s"
    else:
        select_sql = f"SELECT {STK_PUBLIC_FIELDS} FROM stks s"
        count_sql = "SELECT COUNT(*) as total FROM stks s"

    if where_conditions:
        where_str = " WHERE " + " AND ".join(where_conditions)
        select_sql += where_str
        count_sql += where_str

    if sort == "name_asc":
        select_sql += " ORDER BY s.kurum_adi ASC"
    elif sort == "name_desc":
        select_sql += " ORDER BY s.kurum_adi DESC"
    elif sort == "newest":
        select_sql += " ORDER BY s.kurulus_tarihi DESC"
    else:
        select_sql += " ORDER BY s.is_verified DESC, s.id ASC"

    total = db.execute(count_sql, params).fetchone()["total"]

    select_sql += " LIMIT ? OFFSET ?"
    query_params = [*params, limit, offset]
    rows = db.execute(select_sql, query_params).fetchall()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "totalPages": (total + limit - 1) // limit,
        "stks": [dict(r) for r in rows]
    }

# ==========================================
# 5. STK DETAIL
# ==========================================
@app.get("/api/stks/{stk_id}")
def get_stk_detail(stk_id: int, db: sqlite3.Connection = Depends(get_db)):
    stk = db.execute("SELECT * FROM stks WHERE id = ?", (stk_id,)).fetchone()
    if not stk:
        raise HTTPException(status_code=404, detail="STK bulunamadı.")

    activities = [dict(r) for r in db.execute(
        "SELECT * FROM stk_activities WHERE stk_id = ? ORDER BY created_at DESC", (stk_id,)
    ).fetchall()]

    return {
        **dict(stk),
        "activities": activities
    }

# ==========================================
# 6. CONTACT / SUPPORT REQUEST SUBMISSION
# ==========================================
@app.post("/api/contact", status_code=201)
def submit_contact_request(
    req: ContactRequestModel,
    db: sqlite3.Connection = Depends(get_db),
    _: None = Depends(rate_limit("contact")),
):
    cursor = db.execute("""
        INSERT INTO contact_requests (
            stk_id, user_name, user_email, user_phone, support_category, subject, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        req.stk_id,
        req.user_name.strip(),
        req.user_email.strip(),
        (req.user_phone or "").strip(),
        req.support_category.strip(),
        req.subject.strip(),
        req.message.strip()
    ))
    db.commit()
    return {
        "success": True,
        "message": "Destek / iletişim talebiniz STK yönetimine iletildi.",
        "requestId": cursor.lastrowid
    }

# ==========================================
# 7. STK AUTHENTICATION & REGISTRATION
# ==========================================
@app.post("/api/auth/register", status_code=201)
def register_stk(
    data: RegisterModel,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
    _: None = Depends(rate_limit("register")),
):
    email = str(data.email).lower()
    existing = db.execute("SELECT id FROM stk_users WHERE email = ?", (email,)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi ile kayıtlı bir hesap zaten var.")

    hashed = hash_password(data.password)
    cursor = db.execute("""
        INSERT INTO stk_users (stk_id, email, password_hash, contact_name, phone, role, is_approved)
        VALUES (NULL, ?, ?, ?, ?, 'pending', 0)
    """, (email, hashed, data.contact_name, data.phone or ""))
    user_id = cursor.lastrowid
    db.commit()

    token = create_access_token({"id": user_id})
    set_auth_cookie(response, token)
    return {
        "success": True,
        "message": "STK kaydı başarıyla oluşturuldu.",
        "user": {
            "id": user_id,
            "email": email,
            "contact_name": data.contact_name,
            "stk_id": None,
            "is_approved": 0
        }
    }

@app.post("/api/auth/login")
def login_stk(
    data: LoginModel,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
    _: None = Depends(rate_limit("login")),
):
    email = str(data.email).lower()
    user = db.execute("SELECT * FROM stk_users WHERE email = ?", (email,)).fetchone()
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="E-posta adresi veya şifre hatalı.")

    if password_needs_rehash(user["password_hash"]):
        db.execute("UPDATE stk_users SET password_hash = ? WHERE id = ?", (hash_password(data.password), user["id"]))
        db.commit()

    token = create_access_token({"id": user["id"]})
    set_auth_cookie(response, token)

    stk_info = None
    if user["stk_id"]:
        stk_row = db.execute("SELECT id, kurum_adi, il, ilce, is_verified, logo_url FROM stks WHERE id = ?", (user["stk_id"],)).fetchone()
        if stk_row:
            stk_info = dict(stk_row)

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "contact_name": user["contact_name"],
            "phone": user["phone"],
            "stk_id": user["stk_id"],
            "is_approved": user["is_approved"],
            "stk": stk_info
        }
    }


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(JWT_COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return {"success": True}


# ==========================================
# 8. STK ADMIN DASHBOARD
# ==========================================
@app.get("/api/stk/dashboard")
def get_dashboard(current_user: dict = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    stk_id = current_user.get("stk_id")
    stk_data = None
    requests = []
    activities = []

    is_approved_admin = current_user.get("role") == "stk_admin" and current_user.get("is_approved") == 1
    if stk_id and is_approved_admin:
        stk_row = db.execute("SELECT * FROM stks WHERE id = ?", (stk_id,)).fetchone()
        if stk_row:
            stk_data = dict(stk_row)
        requests = [dict(r) for r in db.execute(
            "SELECT * FROM contact_requests WHERE stk_id = ? ORDER BY created_at DESC", (stk_id,)
        ).fetchall()]
        activities = [dict(r) for r in db.execute(
            "SELECT * FROM stk_activities WHERE stk_id = ? ORDER BY created_at DESC", (stk_id,)
        ).fetchall()]

    return {
        "user": {
            "id": current_user["id"],
            "email": current_user["email"],
            "contact_name": current_user["contact_name"],
            "phone": current_user["phone"],
            "role": current_user["role"],
            "is_approved": current_user["is_approved"]
        },
        "stk": stk_data,
        "requests": requests,
        "activities": activities
    }

@app.put("/api/stk/profile")
def update_profile(
    data: ProfileUpdateModel,
    current_user: dict = Depends(require_approved_stk_user),
    db: sqlite3.Connection = Depends(get_db)
):
    stk_id = current_user["stk_id"]

    db.execute("""
        UPDATE stks SET
            telefon = COALESCE(?, telefon),
            email = COALESCE(?, email),
            web_site = COALESCE(?, web_site),
            kurum_adresi = COALESCE(?, kurum_adresi),
            aciklama = COALESCE(?, aciklama),
            logo_url = COALESCE(?, logo_url)
        WHERE id = ?
    """, (data.telefon, data.email, data.web_site, data.kurum_adresi, data.aciklama, data.logo_url, stk_id))
    db.commit()

    updated = db.execute("SELECT * FROM stks WHERE id = ?", (stk_id,)).fetchone()
    return {"success": True, "message": "STK profili başarıyla güncellendi.", "stk": dict(updated)}

@app.post("/api/stk/activities", status_code=201)
def add_activity(
    data: ActivityCreateModel,
    current_user: dict = Depends(require_approved_stk_user),
    db: sqlite3.Connection = Depends(get_db)
):
    stk_id = current_user["stk_id"]

    cursor = db.execute("""
        INSERT INTO stk_activities (stk_id, title, category, content, event_date, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (stk_id, data.title.strip(), data.category or "Duyuru", data.content.strip(), data.event_date or "", data.image_url or ""))
    db.commit()

    return {"success": True, "message": "Faaliyet / Duyuru başarıyla yayınlandı.", "activityId": cursor.lastrowid}

@app.patch("/api/stk/requests/{req_id}")
def update_request_status(
    req_id: int,
    data: StatusUpdateModel,
    current_user: dict = Depends(require_approved_stk_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.execute("""
        UPDATE contact_requests SET
            status = COALESCE(?, status),
            admin_notes = COALESCE(?, admin_notes)
        WHERE id = ? AND stk_id = ?
    """, (data.status, data.admin_notes, req_id, current_user["stk_id"]))
    if cursor.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=404, detail="Talep bulunamadı.")
    db.commit()
    return {"success": True, "message": "Talep durumu güncellendi."}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount static frontend build if available
CLIENT_DIST = os.path.join(os.path.dirname(BASE_DIR), 'client', 'dist')
@app.api_route("/api/{unknown_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def unknown_api(unknown_path: str):
    raise HTTPException(status_code=404, detail="API endpoint bulunamadı.")


if os.path.exists(CLIENT_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_DIST, "assets")), name="assets")
    client_root = Path(CLIENT_DIST).resolve()

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = (client_root / full_path).resolve()
        if file_path.is_relative_to(client_root) and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(client_root / "index.html")

if __name__ == "__main__":
    import uvicorn
    print("=================================================")
    print("🚀 STK Platformu FastAPI Sunucusu Başlatılıyor...")
    print("🌐 Web Arayüzü & API: http://127.0.0.1:8000")
    print("📊 102.301 STK SQLite FTS5 veritabanı aktif!")
    print("=================================================")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
