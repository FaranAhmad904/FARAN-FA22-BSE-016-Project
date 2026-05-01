import os
import time
import threading
import traceback
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from collections import OrderedDict
from bson import ObjectId
from pymongo import MongoClient
from flask import Flask, jsonify, request
from manager_ai_analytics import (
    most_preferred_spice_level,
    price_sensitivity_analysis,
    generate_manager_insight_summary,
    process_user_ai_request,
)

app = Flask(__name__)

@app.after_request
def _add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-User-Id"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

MONGODB_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGO_DB_NAME", "resturantfinder")
COLL_USER_PREFERENCES = os.getenv("MONGODB_USER_PREFERENCES", "userpreferences")
COLL_DEALS = os.getenv("MONGODB_DEALS", "deals")
COLL_RESTAURANTS = os.getenv("MONGODB_RESTAURANTS", "restaurants")
COLL_INTERACTIONS = os.getenv("MONGODB_DEAL_INTERACTIONS", "deal_interactions")

_cache_lock = threading.Lock()
_cache: Dict[str, Any] = {
    "city": "",
    "user_interactions": [],
    "deals": [],
    "interactions": [],
    "spice_pref": None,
    "price_sensitivity": None,
    "summary": "",
    "last_updated": 0,
}

def _get_db():
    client = MongoClient(MONGODB_URI)
    return client[MONGODB_DB]
def _as_object_id(val: Any):
    try:
        s = str(val)
        return ObjectId(s)
    except Exception:
        return None

def _to_spice_text(value: Any) -> Optional[str]:
    try:
        if isinstance(value, str):
            v = value.strip().title()
            if v:
                return v
        n = int(value)
        if 1 <= n <= 2:
            return "Mild"
        if n == 3:
            return "Moderate"
        if 4 <= n <= 5:
            return "Very Spicy"
        return None
    except Exception:
        return None

def _spice_text_to_numeric(text: Any) -> int:
    try:
        if isinstance(text, (int, float)):
            return int(text)
        t = str(text).strip().lower()
        if t in ("mild", "low"):
            return 2
        if t in ("moderate", "medium"):
            return 3
        if t in ("very spicy", "high", "spicy"):
            return 5
        return 3
    except Exception:
        return 3

def _map_budget_label(budget_raw: Any, budget_min: Any, budget_max: Any) -> str:
    try:
        if isinstance(budget_raw, str):
            b = budget_raw.strip().lower()
            if "low" in b:
                return "low"
            if "medium" in b:
                return "medium"
            if "high" in b:
                return "high"
        if isinstance(budget_min, (int, float)) and isinstance(budget_max, (int, float)):
            rng = float(budget_max) - float(budget_min)
            if rng <= 500:
                return "low"
            if rng <= 1500:
                return "medium"
            return "high"
    except Exception:
        pass
    return "medium"

def _normalize_title(s: Any) -> str:
    try:
        return str(s).strip().title()
    except Exception:
        return ""

def _clamp_score(x: Any) -> float:
    try:
        v = float(x)
    except Exception:
        v = 0.0
    return max(0.0, min(1.0, v))

def _spice_numeric_to_text(v: Any) -> Optional[str]:
    try:
        n = int(v)
        if n <= 2:
            return "Mild"
        if n == 3:
            return "Moderate"
        return "Very Spicy"
    except Exception:
        return None

def _budget_label_for_price(label: str, price: Any) -> bool:
    try:
        p = float(price)
    except Exception:
        return False
    l = (label or "").lower()
    if l == "low":
        return p < 600
    if l == "high":
        return p > 1200
    return 600 <= p <= 1200

def build_user_interactions(city: str, prefs: List[Dict[str, Any]], deals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    interactions: List[Dict[str, Any]] = []
    
    # User Requirement: Map action -> numeric engagement weight
    ACTION_WEIGHT = {
        "view": 1,
        "click": 2,
        "save": 3
    }
    
    target_city_norm = _normalize_title(city) if city else ""

    for d in prefs:
        # User Requirement: Normalize city (strip + title case)
        pref_city = _normalize_title(d.get("city"))
        if not pref_city:
            continue
            
        # Filter by City
        if target_city_norm and target_city_norm != pref_city:
            continue

        spice_text = _spice_numeric_to_text(d.get("spiceLevel"))
        if not spice_text:
            continue
            
        # Extract dietary preference
        dietary = d.get("dietary")
        dietary_norm = _normalize_title(dietary) if dietary else "None"
        
        # User Requirement: Calculate engagement_score robustly
        # Priority: actions > action > engagementScore
        total_score = 0.0
        di = d.get("dealInteractions") or []
        
        if di:
            for x in di:
                item_score = 0.0
                
                # 1. Try actions object
                actions = x.get("actions")
                if isinstance(actions, dict):
                    for action_type, count in actions.items():
                        w = ACTION_WEIGHT.get(action_type, 0)
                        try:
                            item_score += (float(count) * w)
                        except (ValueError, TypeError):
                            pass
                
                # 2. Fallback to legacy action
                if item_score == 0:
                    action = x.get("action")
                    if action and isinstance(action, str):
                        item_score = float(ACTION_WEIGHT.get(action, 1))
                
                # 3. Fallback to stored engagementScore
                if item_score == 0:
                    try:
                        item_score = float(x.get("engagementScore", x.get("engagement_score", 0)))
                    except (ValueError, TypeError):
                        pass
                
                total_score += item_score
        else:
            # Fallback to user-level stored score if no deal interactions
            try:
                total_score = float(d.get("engagementScore") or 0)
            except (ValueError, TypeError):
                pass

        interactions.append({
            "city": pref_city, 
            "spice_level": spice_text, 
            "dietary": dietary_norm,
            "engagement_score": total_score
        })
        
    return interactions

def build_deal_interactions(prefs: List[Dict[str, Any]], deals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    interactions: List[Dict[str, Any]] = []
    if not prefs:
        return interactions

    # User Requirement: Map action -> numeric engagement weight
    ACTION_WEIGHT = {
        "view": 1,
        "click": 2,
        "save": 3
    }
    
    # Pre-build deal price map for fallback
    deal_price_map = {}
    for deal in deals:
        did = str(deal.get("deal_id", ""))
        try:
            p = float(deal.get("price", 0))
            deal_price_map[did] = p
        except (ValueError, TypeError):
            pass

    for d in prefs:
        di = d.get("dealInteractions") or []
        
        for x in di:
            deal_id = str(x.get("deal_id"))
            
            # 1. Price Strategy: Snapshot -> Current -> Skip if 0
            price_val = 0.0
            
            # Try snapshot
            raw_price = x.get("dealPrice")
            if raw_price is not None:
                try:
                    price_val = float(raw_price)
                except (ValueError, TypeError):
                    price_val = 0.0
            
            # Fallback to current deal price
            if price_val == 0.0:
                price_val = deal_price_map.get(deal_id, 0.0)
            
            # If still 0, we cannot use for price sensitivity (X axis = 0 is problematic or valid? 
            # Usually 0 price is invalid for a deal).
            # User says: "Include interactions even if dealPrice is missing... Ensure price_sensitivity has enough points"
            # If price is 0, we skip.
            if price_val <= 0:
                continue
                
            calculated_score = 0.0
            
            # 2. Engagement Strategy: Actions -> Action -> EngagementScore
            
            # Try actions object
            actions = x.get("actions")
            if isinstance(actions, dict):
                for action_type, count in actions.items():
                    w = ACTION_WEIGHT.get(action_type, 0)
                    try:
                        calculated_score += (float(count) * w)
                    except (ValueError, TypeError):
                        pass
            
            # Fallback to legacy action
            if calculated_score == 0:
                action = x.get("action")
                if action and isinstance(action, str):
                    calculated_score = float(ACTION_WEIGHT.get(action, 1))
            
            # Fallback to stored engagementScore
            if calculated_score == 0:
                try:
                    calculated_score = float(x.get("engagementScore", x.get("engagement_score", 0)))
                except (ValueError, TypeError):
                    pass
            
            # User Req: Include all valid deals even if engagement is 0 (valid data point: "ignored")
            interactions.append({
                "deal_id": deal_id, 
                "price": price_val, 
                "engagement_score": calculated_score
            })
                
    return interactions
# deprecated: no decay-based engagement; real clicks only

# deprecated: no synthetic/decay-based user interactions

def fetch_deals() -> List[Dict[str, Any]]:
    try:
        db = _get_db()
        docs = list(db[COLL_DEALS].find({}, {"_id": 1, "deal_id": 1, "price": 1, "city": 1}))
        result: List[Dict[str, Any]] = []
        for d in docs:
            did = d.get("deal_id", d.get("_id"))
            if isinstance(did, ObjectId):
                did = str(did)
            price = d.get("price", 0)
            try:
                price = float(price)
            except Exception:
                price = 0.0
            result.append({"deal_id": did, "price": price, "city": d.get("city", "")})
        # Fallback: flatten deals from restaurants collection if standalone deals are absent
        if not result:
            restaurants = list(db[COLL_RESTAURANTS].find({}, {"_id": 1, "city": 1, "deals": 1}))
            for r in restaurants:
                r_city = r.get("city", "")
                for deal in (r.get("deals") or []):
                    did = deal.get("_id") or deal.get("deal_id") or deal.get("title")
                    if isinstance(did, ObjectId):
                        did = str(did)
                    price = deal.get("price", 0)
                    try:
                        price = float(price)
                    except Exception:
                        price = 0.0
                    result.append({"deal_id": did, "price": price, "city": r_city})
        return result
    except Exception as e:
        print("[AI Service] ERROR fetching deals:", e)
        traceback.print_exc()
        return []

def fetch_interactions() -> List[Dict[str, Any]]:
    try:
        db = _get_db()
        docs = list(db[COLL_INTERACTIONS].find({}, {"deal_id": 1, "engagement_score": 1, "engagementScore": 1}))
        result: List[Dict[str, Any]] = []
        for d in docs:
            did = d.get("deal_id")
            if isinstance(did, ObjectId):
                did = str(did)
            score = d.get("engagement_score", d.get("engagementScore", 0.0))
            try:
                score = float(score)
            except Exception:
                score = 0.0
            result.append({"deal_id": did, "engagement_score": max(0.0, min(1.0, score))})
        return result
    except Exception as e:
        print("[AI Service] ERROR fetching interactions:", e)
        traceback.print_exc()
        return []

def refresh_analytics(city: str = "") -> None:
    print("[AI Service] Fetching FRESH data...")
    try:
        deals = fetch_deals()
        db = _get_db()
        prefs_q = {
            "$or": [
                {"city": {"$regex": f"^{city}$", "$options": "i"}} if city else {},
                {"city": {"$in": [None, "", " "]}},
            ]
        }
        prefs = list(
            db[COLL_USER_PREFERENCES].find(
                prefs_q,
                {
                    "userId": 1,
                    "city": 1,
                    "budget": 1,
                    "spiceLevel": 1,
                    "cuisine": 1,
                    "dietary": 1,
                    "dealInteractions": 1,
                    "engagementScore": 1,
                },
            )
        )
        print(f"[AI Service] Raw userPreferences count: {len(prefs)}")
        if len(prefs) > 0:
            print(f"[AI Service] Sample raw pref: {prefs[0]}")

        if not prefs:
             print("[AI Service] No user preference data available.")
             with _cache_lock:
                 _cache.update({
                     "summary": "No real user preference data available yet",
                     "city": city or "N/A",
                     "user_interactions": [],
                     "deals": deals,
                     "interactions": [],
                     "spice_pref": None,
                     "price_sensitivity": None,
                     "last_updated": int(time.time()),
                 })
             return

        user_interactions = build_user_interactions(city, prefs, deals)
        # derive paired interactions from userPreferences
        interactions = build_deal_interactions(prefs, deals)

        # If no interactions for requested city, fallback to global
        # Decide display city
        effective_city = city
        if not effective_city:
            # User Requirement: City must be computed using frequency count (most common city among users)
            try:
                from collections import Counter
                # Collect all cities from RAW prefs, not just interactions
                all_cities = [p.get("city") for p in prefs if p.get("city")]
                # Filter out empty/whitespace
                all_cities = [c.strip().title() for c in all_cities if str(c).strip()]
                
                if all_cities:
                    effective_city = Counter(all_cities).most_common(1)[0][0]
                    print(f"[AI Service] Computed most common city: {effective_city}")
                else:
                    effective_city = "Unknown"
            except Exception as e:
                print(f"[AI Service] Error computing city frequency: {e}")
                effective_city = "Unknown"
                
        spice_pref = most_preferred_spice_level(effective_city, user_interactions)
        print(f"[AI Service] Most preferred spice level: {spice_pref}")
        price_info = price_sensitivity_analysis(deals, interactions)
        print(f"[AI Service] Price sensitivity analysis: {price_info}")
        summary = generate_manager_insight_summary(effective_city, user_interactions, deals, interactions)
        print(f"[AI Service] Summary insights: {summary}")
        with _cache_lock:
            _cache.update(
                {
                    "city": effective_city,
                    "user_interactions": user_interactions,
                    "deals": deals,
                    "interactions": interactions,
                    "spice_pref": spice_pref,
                    "price_sensitivity": price_info,
                    "summary": summary,
                    "last_updated": int(time.time()),
                }
            )
    except Exception as e:
        print("[AI Service] ERROR while refreshing analytics:", e)
        traceback.print_exc()

def _budget_range_for_label(label: str) -> tuple[float, float]:
    l = (label or "").lower()
    if l == "low":
        return (0.0, 500.0)
    if l == "high":
        return (1500.0, 999999.0)
    return (500.0, 1500.0)

def _score_price_against_budget(price: float, label: str) -> float:
    try:
        p = float(price)
        lo, hi = _budget_range_for_label(label)
        center = (lo + hi) / 2.0
        width = max(1.0, (hi - lo) / 2.0)
        # Gaussian-like score around budget center
        dist = abs(p - center) / width
        score = max(0.0, min(1.0, 2.0 * (2.71828 ** (-dist))))
        return score
    except Exception:
        return 0.5

def _build_synthetic_interactions_from_budget(deals: List[Dict[str, Any]], prefs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return []

def _loop_refresh(interval_sec: int = 60) -> None:
    while True:
        refresh_analytics(_cache.get("city", ""))
        time.sleep(interval_sec)

@app.get("/api/manager/ai-insights")
def api_ai_insights():
    try:
        city = request.args.get("city") or ""
        now = int(time.time())
        if now - _cache.get("last_updated", 0) > 60:
            refresh_analytics(city)
        with _cache_lock:
            resp = {
                "success": True,
                "data": {
                    "city": _cache["city"],
                    "spice_pref": _cache["spice_pref"],
                    "price_sensitivity": _cache["price_sensitivity"],
                    "summary": _cache["summary"],
                    "last_updated": _cache["last_updated"],
                },
            }
        return jsonify(resp), 200
    except Exception as e:
        print("[AI Service] ERROR in /api/manager/ai-insights:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@app.post("/api/admin/migrate-deal-interactions")
def api_migrate_deal_interactions():
    try:
        db = _get_db()
        cur = db[COLL_USER_PREFERENCES].find({})
        updated = 0
        db[COLL_USER_PREFERENCES].delete_many({"userId": ""})
        for doc in cur:
            if "dealInteractions" in doc and isinstance(doc.get("dealInteractions"), list):
                continue
            new_doc = OrderedDict()
            for k in doc.keys():
                if k == "dealInteractions":
                    continue
                new_doc[k] = doc[k]
                if k == "spiceLevel" and "dealInteractions" not in doc:
                    new_doc["dealInteractions"] = []
            if "spiceLevel" not in doc and "dealInteractions" not in doc:
                new_doc["dealInteractions"] = []
            db[COLL_USER_PREFERENCES].replace_one({"_id": doc["_id"]}, new_doc)
            updated += 1
        return jsonify({"success": True, "updated": updated}), 200
    except Exception as e:
        print("[AI Service] ERROR in migrate-deal-interactions:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/analytics/interaction", methods=["POST"])
def api_analytics_interaction():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        user_id_raw = payload.get("userId") or request.headers.get("X-User-Id")
        if not user_id_raw or str(user_id_raw).strip() == "":
            return jsonify({"success": False, "error": "userId required"}), 400
        user_id_obj = _as_object_id(user_id_raw)
        if not user_id_obj:
            return jsonify({"success": False, "error": "invalid userId"}), 400
        deal_id = payload.get("deal_id")
        action_type = (payload.get("action_type") or "view").strip().lower()
        city = payload.get("city") or ""
        ts = datetime.now(timezone.utc)

        if not deal_id:
            return jsonify({"success": False, "error": "deal_id required"}), 400

        db = _get_db()
        interaction = {
            "deal_id": str(deal_id),
            "action": action_type,
            "timestamp": ts,
        }
        result = db[COLL_USER_PREFERENCES].update_one(
            {"userId": user_id_obj},
            {"$push": {"dealInteractions": interaction}},
            upsert=False,
        )
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "user preferences not found"}), 404
        doc = db[COLL_USER_PREFERENCES].find_one({"userId": user_id_obj}, {"dealInteractions": 1})
        new_score = 0
        try:
            new_score = len(doc.get("dealInteractions") or [])
        except Exception:
            new_score = 0
        db[COLL_USER_PREFERENCES].update_one(
            {"userId": user_id_obj},
            {"$set": {"engagementScore": new_score}},
            upsert=False,
        )

        # Refresh analytics for provided city or cache city
        refresh_analytics(city)
        return jsonify({"success": True}), 200
    except Exception as e:
        print("[AI Service] ERROR in /api/analytics/interaction:", e)
        traceback.print_exc()

@app.route("/api/user/deal-interaction", methods=["POST"])
def api_user_deal_interaction():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        user_id_raw = payload.get("userId") or request.headers.get("X-User-Id")
        if not user_id_raw or str(user_id_raw).strip() == "":
            return jsonify({"success": False, "error": "userId required"}), 400
        user_id_obj = _as_object_id(user_id_raw)
        if not user_id_obj:
            return jsonify({"success": False, "error": "invalid userId"}), 400
        deal_id = payload.get("deal_id")
        action = (payload.get("action") or "view").strip().lower()
        city = payload.get("city") or ""
        ts = datetime.now(timezone.utc)
        if not deal_id:
            return jsonify({"success": False, "error": "deal_id required"}), 400
        db = _get_db()
        interaction = {"deal_id": str(deal_id), "action": action, "timestamp": ts}
        result = db[COLL_USER_PREFERENCES].update_one(
            {"userId": user_id_obj},
            {"$push": {"dealInteractions": interaction}},
            upsert=False,
        )
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "user preferences not found"}), 404
        doc = db[COLL_USER_PREFERENCES].find_one({"userId": user_id_obj}, {"dealInteractions": 1})
        new_score = 0
        try:
            new_score = len(doc.get("dealInteractions") or [])
        except Exception:
            new_score = 0
        db[COLL_USER_PREFERENCES].update_one(
            {"userId": user_id_obj},
            {"$set": {"engagementScore": new_score}},
            upsert=False,
        )
        refresh_analytics(city)
        return jsonify({"success": True}), 200
    except Exception as e:
        print("[AI Service] ERROR in /api/user/deal-interaction:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/api/customer/ai-recommend", methods=["POST"])
def api_customer_ai_recommend():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        processed = process_user_ai_request(payload)
        user_id_raw = request.headers.get("X-User-Id") or payload.get("userId")
        if not user_id_raw or str(user_id_raw).strip() == "":
            return jsonify({"success": False, "error": "userId required"}), 400
        user_id_obj = _as_object_id(user_id_raw)
        if not user_id_obj:
            return jsonify({"success": False, "error": "invalid userId"}), 400
        city = processed.get("city") or payload.get("city") or ""
        spice_num = _spice_text_to_numeric(processed.get("spice_level") or payload.get("spice_level"))
        budget_label = _map_budget_label(
            payload.get("budget"),
            processed.get("budget_min"),
            processed.get("budget_max"),
        )
        doc = {
            "userId": user_id_obj,
            "city": city,
            "cuisine": processed.get("cuisines") or payload.get("cuisines") or [],
            "dietary": ((processed.get("dietary") or payload.get("dietary") or "None")).lower(),
            "budget": budget_label,
            "spiceLevel": spice_num,
            "updatedAt": datetime.now(timezone.utc),
        }
        db = _get_db()
        db[COLL_USER_PREFERENCES].update_one(
            {"userId": user_id_obj},
            {"$set": doc, "$setOnInsert": {"createdAt": datetime.now(timezone.utc), "dealInteractions": []}},
            upsert=True,
        )
        refresh_analytics(city)
        return jsonify({"success": True, "message": "preferences saved", "city": city}), 200
    except Exception as e:
        print("[AI Service] ERROR in /api/customer/ai-recommend:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

def main():
    t = threading.Thread(target=_loop_refresh, args=(60,), daemon=True)
    t.start()
    try:
        api_migrate_deal_interactions()
    except Exception:
        pass
    refresh_analytics(_cache.get("city", ""))
    print("[AI Service] Server starting on http://localhost:7001")
    app.run(host="0.0.0.0", port=7001)

if __name__ == "__main__":
    main()
