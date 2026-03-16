"""
Original Word Bible — Full Flask Application
Features: Auth, Admin Dashboard, Hebrew/Greek Lexicon, KJV Bible Reader, Diagnostic Codes
"""
import json, os, re, uuid, hashlib, datetime
from functools import wraps
from flask import (Flask, render_template, request, jsonify,
                   session, redirect, url_for, flash)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "owb-secret-key-2024-xK9mP2qR")

# ── Admin credentials (hardcoded as requested) ─────────────────────────────
ADMIN_USERNAME = "SNL2721"
ADMIN_PASSWORD = "Fearknot14!"

# ── In-memory user store (persisted to users.json) ─────────────────────────
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
DIAG_FILE  = os.path.join(os.path.dirname(__file__), "diagnostics.json")

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def load_diagnostics():
    if os.path.exists(DIAG_FILE):
        with open(DIAG_FILE, "r") as f:
            return json.load(f)
    return []

def save_diagnostics(diags):
    with open(DIAG_FILE, "w") as f:
        json.dump(diags, f, indent=2)

def generate_diag_code(username, issue_type="general"):
    """Generate a short diagnostic code for support."""
    ts = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    raw = f"{username}-{issue_type}-{ts}"
    short = hashlib.md5(raw.encode()).hexdigest()[:8].upper()
    code = f"OWB-{short}"
    diags = load_diagnostics()
    diags.append({
        "code": code,
        "username": username,
        "type": issue_type,
        "timestamp": ts,
        "resolved": False
    })
    save_diagnostics(diags)
    return code

# ── Load lexicons ──────────────────────────────────────────────────────────
with open("hebrew_lexicon.json", "r", encoding="utf-8") as f:
    word_lexicon = json.load(f)

with open("strongs_hebrew_lexicon.json", "r", encoding="utf-8") as f:
    strongs_hebrew = json.load(f)

with open("strongs_greek_lexicon.json", "r", encoding="utf-8") as f:
    strongs_greek = json.load(f)

with open("curated_verses.json", "r", encoding="utf-8") as f:
    curated_verses = json.load(f)

with open("bible_books_meta.json", "r", encoding="utf-8") as f:
    bible_books_meta = json.load(f)

# Bible is loaded lazily per book to save memory
_bible_cache = {}

def get_bible_book(book_name):
    if book_name not in _bible_cache:
        try:
            with open("kjv_bible.json", "r", encoding="utf-8") as f:
                full = json.load(f)
            _bible_cache.update(full)
        except Exception:
            return None
    return _bible_cache.get(book_name)

# ── Auth helpers ───────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

# ── Pages ──────────────────────────────────────────────────────────────────
@app.route('/')
def root():
    if session.get("logged_in"):
        return redirect(url_for("app_page"))
    return redirect(url_for("login_page"))

@app.route('/login')
def login_page():
    if session.get("logged_in"):
        return redirect(url_for("app_page"))
    return render_template("login.html")

@app.route('/app')
@login_required
def app_page():
    gen_data  = curated_verses["genesis_1_1"]["words"]
    john_data = curated_verses["john_1_1"]["words"]
    return render_template("index.html",
                           genesis_data=gen_data,
                           john_data=john_data,
                           username=session.get("username"),
                           is_admin=session.get("is_admin", False),
                           books=bible_books_meta)

# ── Auth API ───────────────────────────────────────────────────────────────
@app.route('/auth/login', methods=['POST'])
def do_login():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400

    # Admin check
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["logged_in"] = True
        session["username"]  = ADMIN_USERNAME
        session["is_admin"]  = True
        session["user_id"]   = "admin"
        return jsonify({"success": True, "redirect": "/app", "is_admin": True})

    # Regular user check
    users = load_users()
    user = users.get(username)
    if user and check_password_hash(user["password_hash"], password):
        session["logged_in"] = True
        session["username"]  = username
        session["is_admin"]  = False
        session["user_id"]   = user["id"]
        # Update last login
        users[username]["last_login"] = datetime.datetime.utcnow().isoformat()
        save_users(users)
        return jsonify({"success": True, "redirect": "/app", "is_admin": False})

    return jsonify({"success": False, "error": "Invalid username or password"}), 401

@app.route('/auth/signup', methods=['POST'])
def do_signup():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not username or not email or not password:
        return jsonify({"success": False, "error": "All fields are required"}), 400

    if len(username) < 3:
        return jsonify({"success": False, "error": "Username must be at least 3 characters"}), 400

    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({"success": False, "error": "Invalid email address"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    if username == ADMIN_USERNAME:
        return jsonify({"success": False, "error": "That username is reserved"}), 400

    users = load_users()
    if username in users:
        return jsonify({"success": False, "error": "Username already taken"}), 409

    # Check email uniqueness
    for u in users.values():
        if u.get("email") == email:
            return jsonify({"success": False, "error": "Email already registered"}), 409

    user_id = str(uuid.uuid4())[:8]
    users[username] = {
        "id":            user_id,
        "username":      username,
        "email":         email,
        "password_hash": generate_password_hash(password),
        "created_at":    datetime.datetime.utcnow().isoformat(),
        "last_login":    None,
        "provider":      "email",
        "active":        True
    }
    save_users(users)

    session["logged_in"] = True
    session["username"]  = username
    session["is_admin"]  = False
    session["user_id"]   = user_id
    return jsonify({"success": True, "redirect": "/app"})

@app.route('/auth/logout', methods=['POST'])
def do_logout():
    session.clear()
    return jsonify({"success": True, "redirect": "/login"})

# ── Admin API ──────────────────────────────────────────────────────────────
@app.route('/admin/users')
@login_required
@admin_required
def admin_users():
    users = load_users()
    result = []
    for uname, u in users.items():
        result.append({
            "username":   uname,
            "email":      u.get("email", ""),
            "created_at": u.get("created_at", ""),
            "last_login": u.get("last_login", ""),
            "provider":   u.get("provider", "email"),
            "active":     u.get("active", True)
        })
    result.sort(key=lambda x: x["created_at"], reverse=True)
    return jsonify(result)

@app.route('/admin/diagnostics')
@login_required
@admin_required
def admin_diagnostics():
    diags = load_diagnostics()
    diags.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify(diags)

@app.route('/admin/diagnostics/resolve', methods=['POST'])
@login_required
@admin_required
def resolve_diagnostic():
    code = (request.json or {}).get("code", "")
    diags = load_diagnostics()
    for d in diags:
        if d["code"] == code:
            d["resolved"] = True
    save_diagnostics(diags)
    return jsonify({"success": True})

@app.route('/admin/users/toggle', methods=['POST'])
@login_required
@admin_required
def toggle_user():
    username = (request.json or {}).get("username", "")
    users = load_users()
    if username in users:
        users[username]["active"] = not users[username].get("active", True)
        save_users(users)
        return jsonify({"success": True, "active": users[username]["active"]})
    return jsonify({"success": False, "error": "User not found"}), 404

# ── Diagnostic Code Generation ─────────────────────────────────────────────
@app.route('/diag/report', methods=['POST'])
@login_required
def report_issue():
    data = request.json or {}
    issue_type = data.get("type", "general")
    username = session.get("username", "unknown")
    code = generate_diag_code(username, issue_type)
    return jsonify({"success": True, "code": code})

# ── Study API ──────────────────────────────────────────────────────────────
@app.route('/translate', methods=['POST'])
@login_required
def translate():
    verse = request.json.get("verse", "")
    words = verse.split()
    result = []
    for w in words:
        w_clean = w.lower().replace(",","").replace(".","").replace(";","").replace(":","")
        data = word_lexicon.get(w, word_lexicon.get(w_clean, {
            "hebrew": w, "strongs": "N/A", "meaning": "N/A", "notes": "Word not in lexicon"
        }))
        result.append({
            "original":        w,
            "script":          data.get("hebrew", ""),
            "strongs":         data.get("strongs", "N/A"),
            "transliteration": data.get("transliteration", ""),
            "meaning":         data.get("meaning", "N/A"),
            "kjv":             data.get("kjv", ""),
            "notes":           data.get("notes", ""),
            "language":        "hebrew"
        })
    return jsonify(result)

@app.route('/lookup/strongs', methods=['POST'])
@login_required
def lookup_strongs():
    number = request.json.get("number", "").strip().upper()
    if number.startswith("H"):
        entry = strongs_hebrew.get(number)
        if entry:
            return jsonify({**entry, "language": "hebrew"})
    elif number.startswith("G"):
        entry = strongs_greek.get(number)
        if entry:
            return jsonify({**entry, "language": "greek"})
    return jsonify({"error": f"Strong's number '{number}' not found"}), 404

@app.route('/search', methods=['POST'])
@login_required
def search_lexicon():
    query  = request.json.get("query", "").strip()
    lang   = request.json.get("language", "both")
    limit  = int(request.json.get("limit", 20))
    if not query:
        return jsonify([])

    results = []
    q_lower = query.lower()

    if re.match(r'^[HhGg]\d+$', query):
        num = query.upper()
        if num.startswith("H") and lang in ("hebrew","both"):
            entry = strongs_hebrew.get(num)
            if entry: results.append({**entry, "language": "hebrew"})
        elif num.startswith("G") and lang in ("greek","both"):
            entry = strongs_greek.get(num)
            if entry: results.append({**entry, "language": "greek"})
        return jsonify(results[:limit])

    if lang in ("hebrew","both"):
        for key, entry in strongs_hebrew.items():
            if (q_lower in entry.get("meaning","").lower() or
                q_lower in entry.get("kjv","").lower() or
                q_lower in entry.get("transliteration","").lower() or
                q_lower in entry.get("hebrew","")):
                results.append({**entry, "language": "hebrew"})
                if len(results) >= limit: break

    if lang in ("greek","both"):
        for key, entry in strongs_greek.items():
            if (q_lower in entry.get("meaning","").lower() or
                q_lower in entry.get("kjv","").lower() or
                q_lower in entry.get("transliteration","").lower() or
                q_lower in entry.get("greek","")):
                results.append({**entry, "language": "greek"})
                if len(results) >= limit * 2: break

    return jsonify(results[:limit])

# ── Bible API ──────────────────────────────────────────────────────────────
@app.route('/bible/books')
@login_required
def bible_books():
    return jsonify(bible_books_meta)

@app.route('/bible/<book>/<int:chapter>')
@login_required
def bible_chapter(book, chapter):
    book_data = get_bible_book(book)
    if not book_data:
        return jsonify({"error": "Book not found"}), 404
    ch_data = book_data.get(str(chapter))
    if not ch_data:
        return jsonify({"error": "Chapter not found"}), 404
    verses = [{"verse": int(k), "text": v} for k, v in ch_data.items()]
    verses.sort(key=lambda x: x["verse"])
    return jsonify({"book": book, "chapter": chapter, "verses": verses})

@app.route('/bible/verse/translate', methods=['POST'])
@login_required
def translate_bible_verse():
    """Translate a single Bible verse text word by word."""
    data = request.json or {}
    text = data.get("text", "")
    book = data.get("book", "")
    is_nt = book in [
        "Matthew","Mark","Luke","John","Acts","Romans",
        "1 Corinthians","2 Corinthians","Galatians","Ephesians",
        "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
        "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
        "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
    ]

    words = text.split()
    result = []
    for w in words:
        w_clean = re.sub(r'[^\w]', '', w.lower())
        if is_nt:
            # Search Greek lexicon by KJV rendering
            found = None
            for entry in strongs_greek.values():
                kjv_words = re.split(r'[\s,;()]+', entry.get("kjv","").lower())
                if w_clean in kjv_words:
                    found = entry
                    break
            if found:
                result.append({
                    "original": w,
                    "script": found.get("greek",""),
                    "strongs": found.get("strongs",""),
                    "transliteration": found.get("transliteration",""),
                    "meaning": found.get("meaning",""),
                    "kjv": found.get("kjv",""),
                    "notes": found.get("notes",""),
                    "language": "greek"
                })
            else:
                result.append({"original": w, "script": "", "strongs": "N/A",
                                "meaning": "N/A", "notes": "", "language": "greek"})
        else:
            data_w = word_lexicon.get(w, word_lexicon.get(w_clean, None))
            if data_w:
                result.append({
                    "original": w,
                    "script": data_w.get("hebrew",""),
                    "strongs": data_w.get("strongs","N/A"),
                    "transliteration": data_w.get("transliteration",""),
                    "meaning": data_w.get("meaning","N/A"),
                    "kjv": data_w.get("kjv",""),
                    "notes": data_w.get("notes",""),
                    "language": "hebrew"
                })
            else:
                result.append({"original": w, "script": "", "strongs": "N/A",
                                "meaning": "N/A", "notes": "", "language": "hebrew"})
    return jsonify(result)

@app.route('/stats')
def stats():
    return jsonify({
        "hebrew_entries": len(strongs_hebrew),
        "greek_entries":  len(strongs_greek),
        "curated_verses": list(curated_verses.keys()),
        "bible_books":    len(bible_books_meta)
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
