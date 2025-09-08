print("🚀 Starting backend server...")

from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from langchain_community.llms.together import Together
from summarizer import adaptive_summarize
import config  # loads environment variables
import requests
import re
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
import requests
SUPABASE_URL = "https://zfrayouyddubrxqngbjr.supabase.co"

from vector_utils import split_transcript_text_dynamic, store_chunks_in_chroma
from summarizer import get_llm, load_vectorstore, summarize_with_map_reduce
from mcq_flashcard_generator import generate_mcqs, generate_flashcards

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
SUPABASE_ANON_KEY = "your-anon-key-here"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcmF5b3V5ZGR1YnJ4cW5nYmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjEwNDksImV4cCI6MjA3MTY5NzA0OX0.0bCLcTXY8og2QVa_xYDz72oK0482iMl0ATY9fb93xtE"
def validate_supabase_token(token: str):
    if not token:
        return None
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}"
            },
            timeout=5,
        )
        if resp.ok:
            return resp.json()
    except Exception as e:
        print("Token validation error:", e)
    return None


def get_video_duration(video_id):
    """
    Get video duration from YouTube using a simple approach
    """
    try:
        # Try to get duration from transcript timestamps
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        if transcript:
            # Get the last timestamp + duration as rough video length
            last_entry = transcript[-1]
            duration_seconds = last_entry.get('start', 0) + last_entry.get('duration', 0)
            return duration_seconds / 60  # Convert to minutes
    except:
        pass
    
    # Fallback: estimate from transcript length (rough approximation)
    return 30  # Default assumption

@app.route('/transcript', methods=['POST', 'OPTIONS'])
def get_transcript_and_summary():
    if request.method == 'OPTIONS':
        # CORS preflight response
        return '', 200
    # Example snippet at start of endpoint
    auth = request.headers.get("Authorization", "")
    token = None
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()

    user = validate_supabase_token(token)
    if user is None:
        # 401 Unauthorized
        return jsonify({"error": "unauthorized", "message": "Please sign in to use this endpoint."}), 401

    # Proceed with the rest of the handler (you can use `user` info for personalization)

    data = request.get_json()
    video_id = data.get('video_id')
    
    try:
        # Step 1: Fetch transcript from YouTube
        raw_transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print("🎬 Transcript fetched")
        
        # Step 1.5: Get video duration
        video_duration = get_video_duration(video_id)
        print(f"⏱️ Video duration: {video_duration:.1f} minutes")
        
        # Step 2: Merge transcript into one long string
        text = " ".join(entry["text"] for entry in raw_transcript if "text" in entry)
        print(f"📝 Transcript length: {len(text)} characters")
        
        # Step 3: Chunk using DYNAMIC chunking based on video length
        documents = split_transcript_text_dynamic(text, video_duration)
        store_chunks_in_chroma(documents)
        print("📦 Transcript dynamically chunked and stored")
        
        # Step 4: Summarize directly using adaptive strategy
        llm = get_llm()
        summary = adaptive_summarize(llm, text, video_duration)
        print("✅ Adaptive summary generated")

        print("✅ Summary generated")
        print(summary)
        return jsonify({
            'transcript': text,
            'summary': summary,
            'video_duration': video_duration,
            'chunks_created': len(documents)
        })
        
    except Exception as e:
        # Check if it's a rate limit error
        error_msg = str(e).lower()
        if 'rate limit' in error_msg or 'quota' in error_msg or 'limit exceeded' in error_msg:
            return jsonify({
                'error': 'rate_limit_exceeded',
                'message': 'API rate limit exceeded. Would you like to upgrade to continue?',
                'upgrade_available': True
            }), 429
        
        return jsonify({'error': str(e)}), 400

@app.route('/check-usage', methods=['GET'])
def check_usage():
    """
    Endpoint to check current API usage status
    """
    # This would integrate with Together AI's usage API when available
    return jsonify({
        'usage_percentage': 85,  # Example
        'requests_remaining': 150,
        'reset_time': '2025-08-06T00:00:00Z'
    })
import re

import json



def parse_flashcard_text(flashcard_text):
    cards = []
    pairs = re.findall(r'Q:\s*(.*?)\s*A:\s*(.*?)(?=\nQ:|\Z)', flashcard_text, re.DOTALL)
    for q, a in pairs:
        cards.append({"question": q.strip(), "answer": a.strip()})
    return cards
import json
import traceback
@app.route('/mcq-flashcards', methods=['POST', 'OPTIONS'])
def get_mcqs_and_flashcards():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    video_id = data.get('video_id')

    try:
        # Step 1: Fetch transcript
        raw_transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join(entry.get("text", "") for entry in raw_transcript)

        # Step 2: Get video duration
        video_duration = get_video_duration(video_id)

        # Step 3: Generate MCQs + Flashcards (LLM)
        llm = get_llm()
        mcqs_raw = generate_mcqs(llm, text, video_duration)
        flashcards_raw = generate_flashcards(llm, text, video_duration)

        # Debug logs
        print("flashcards_raw type:", type(flashcards_raw))
        print("flashcards_raw:", flashcards_raw)
        print("mcqs_raw type:", type(mcqs_raw))
        print("mcqs_raw:", mcqs_raw)

        # --------- Helpers for normalization ----------
        import json, re

        def _try_load_json(s):
            try:
                return json.loads(s)
            except Exception:
                return None

        def _flatten_to_dicts(payload):
            """Accepts: list/dict/str; returns flat list of dicts (no validation yet)."""
            out = []
            if payload is None:
                return out
            if isinstance(payload, str):
                loaded = _try_load_json(payload)
                if loaded is None:
                    return out
                return _flatten_to_dicts(loaded)
            if isinstance(payload, dict):
                out.append(payload)
                return out
            if isinstance(payload, list):
                for item in payload:
                    if isinstance(item, dict):
                        out.append(item)
                    elif isinstance(item, list):
                        out.extend(_flatten_to_dicts(item))
                    elif isinstance(item, str):
                        loaded = _try_load_json(item)
                        if loaded is not None:
                            out.extend(_flatten_to_dicts(loaded))
                return out
            return out

        # Light tokenizer + crude stemmer (ly/ing/ed/es/s)
        def _normalize_text(s):
            return re.sub(r'[^a-z0-9]+', ' ', (s or '').lower()).strip()

        def _stem_token(t):
            for suf in ("ly", "ing", "ed", "es", "s"):
                if len(t) > 3 and t.endswith(suf):
                    return t[: -len(suf)]
            return t

        def _tokens(s):
            return [ _stem_token(t) for t in _normalize_text(s).split() if t ]

        def _substring_score(a, b):
            # normalized substring presence
            na, nb = _normalize_text(a), _normalize_text(b)
            return 1.0 if na and na in nb else 0.0

        def _overlap_score(a, b):
            ta, tb = set(_tokens(a)), set(_tokens(b))
            if not ta:
                return 0.0
            return len(ta & tb) / len(ta)

        def _option_match_score(option, explanation):
            # pick the stronger of substring match or token overlap
            return max(_substring_score(option, explanation), _overlap_score(option, explanation))

        def _reconcile_correct(item):
            """
            Returns item coerced to {question, options, correct, explanation}.
            If the provided correct index seems wrong, fix it using explanation/answer.
            """
            if not isinstance(item, dict):
                return None

            q = item.get("question")
            opts = item.get("options")
            expl = item.get("explanation") or ""

            # Prefer explicit 'answer' string if present
            explicit_answer = item.get("answer") or item.get("correct_answer") or None

            # Accept either 'answer_index' or 'correct'
            if "answer_index" in item:
                corr = item.get("answer_index")
            else:
                corr = item.get("correct")

            if not isinstance(q, str):
                return None
            if not isinstance(opts, list) or len(opts) != 4:
                return None

            # Try to enforce/repair correct index
            fixed_idx = None

            # 1) If explicit 'answer' matches an option, use that index
            if explicit_answer:
                for i, o in enumerate(opts):
                    if _normalize_text(o) == _normalize_text(explicit_answer):
                        fixed_idx = i
                        break

            # 2) If no explicit match, use explanation similarity to choose best option
            if fixed_idx is None:
                scores = [ _option_match_score(o, expl) for o in opts ]
                best_idx = max(range(len(opts)), key=lambda i: scores[i])
                best_score = scores[best_idx]
                # We'll only override if best score is meaningful or current is invalid
                corr_valid = isinstance(corr, int) and 0 <= corr < 4
                curr_score = scores[corr] if corr_valid else -1.0
                if (not corr_valid) or (best_score > 0 and best_idx != corr and curr_score == 0):
                    fixed_idx = best_idx

            # 3) Fall back to provided corr if still nothing
            if fixed_idx is None:
                if not isinstance(corr, int) or not (0 <= corr < 4):
                    corr = 0
                fixed_idx = int(corr)

            # Debug log when we changed it
            if isinstance(corr, int) and corr != fixed_idx:
                print(f"[MCQ FIX] Adjusted correct index from {corr} -> {fixed_idx} based on explanation match.")

            return {
                "question": q.strip(),
                "options": [str(o).strip() for o in opts],
                "correct": fixed_idx,
                "explanation": str(expl).strip()
            }

        # --------- Normalize + reconcile MCQs ----------
        flat_mcq_items = _flatten_to_dicts(mcqs_raw)
        mcqs = []
        for it in flat_mcq_items:
            fixed = _reconcile_correct(it)
            if fixed:
                mcqs.append(fixed)

        # --------- Parse flashcards (existing logic) ----------
        flashcards = []
        if isinstance(flashcards_raw, list):
            for chunk in flashcards_raw:
                if isinstance(chunk, str):
                    flashcards.extend(parse_flashcard_text(chunk))
                elif isinstance(chunk, dict):
                    q = chunk.get("question") or chunk.get("q")
                    a = chunk.get("answer") or chunk.get("a")
                    if q and a:
                        flashcards.append({"question": q.strip(), "answer": a.strip()})
                elif isinstance(chunk, list):
                    for sub in chunk:
                        if isinstance(sub, str):
                            flashcards.extend(parse_flashcard_text(sub))
                        elif isinstance(sub, dict):
                            q = sub.get("question") or sub.get("q")
                            a = sub.get("answer") or sub.get("a")
                            if q and a:
                                flashcards.append({"question": q.strip(), "answer": a.strip()})
        elif isinstance(flashcards_raw, str):
            flashcards = parse_flashcard_text(flashcards_raw)

        print("*********************************************")
        print("Final mcqs count:", len(mcqs))
        print("Final flashcards count:", len(flashcards))

        return jsonify({
            'video_duration': video_duration,
            'mcqs': mcqs,
            'flashcards': flashcards
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

from flask import Flask, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from flask_dance.contrib.google import make_google_blueprint, google
import os
import requests
import json
import hmac
import hashlib
import base64

# Environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
LEMON_API_KEY = os.getenv("LEMON_API_KEY")
LEMON_STORE_ID = os.getenv("LEMON_STORE_ID")
LEMON_VARIANT_ID = os.getenv("LEMON_VARIANT_ID")
LEMON_WEBHOOK_SECRET = os.getenv("LEMON_WEBHOOK_SECRET")

# Flask app
app.secret_key = os.getenv("SECRET_KEY", "dev_secret")
#CORS(app, supports_credentials=True)

# Google OAuth setup
google_bp = make_google_blueprint(
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ]
)

app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/login/google/authorized")
def google_login_callback():
    if not google.authorized:
        return redirect(url_for("google.login"))

    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return jsonify({"error": "Failed to fetch user info"}), 400

    user_info = resp.json()
    session["user_email"] = user_info["email"]

    return redirect("http://localhpst:3000")  

@app.route("/me")
def get_user():
    return jsonify({
        "email": session.get("user_email"),
        "logged_in": "user_email" in session
    })

# Create checkout
@app.route('/create-checkout', methods=['POST'])
def create_checkout():
    if "user_email" not in session:
        return jsonify({"error": "Not logged in"}), 401

    url = "https://api.lemonsqueezy.com/v1/checkouts"
    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": session["user_email"]
                }
            },
            "relationships": {
                "store": {"data": {"type": "stores", "id": LEMON_STORE_ID}},
                "variant": {"data": {"type": "variants", "id": LEMON_VARIANT_ID}}
            }
        }
    }
    headers = {
        "Authorization": f"Bearer {LEMON_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    res = requests.post(url, headers=headers, data=json.dumps(payload))
    return jsonify(res.json()), res.status_code

# Webhook for payments
@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.data
    signature = request.headers.get("X-Signature")

    computed_signature = base64.b64encode(
        hmac.new(
            LEMON_WEBHOOK_SECRET.encode(),
            msg=payload,
            digestmod=hashlib.sha256
        ).digest()
    ).decode()

    if not hmac.compare_digest(signature, computed_signature):
        return jsonify({"error": "Invalid signature"}), 400

    event = request.json
    event_type = event.get("meta", {}).get("event_name")

    if event_type == "order_created":
        email = event["data"]["attributes"]["user_email"]
        print(f"✅ Payment received from {email}")
        # TODO: Mark user as premium in DB

    return jsonify({"status": "success"}), 200


@app.route('/')
def index():
    return redirect("http://localhost:3000")

if __name__ == '__main__':
    app.run(debug=True)