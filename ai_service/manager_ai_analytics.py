"""
Manager AI Analytics Module
---------------------------
Production-ready AI utilities for the Manager Dashboard (no UI).

Features:
- Most preferred spice level by city (weighted by engagement)
- Price sensitivity analysis using Linear Regression
- Input mapping/normalization for the recommendation engine
- Insight summary generator for business-friendly reporting
"""

from typing import List, Dict, Optional, Tuple
import math
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def _normalize_string(value: Optional[str]) -> Optional[str]:
    """
    Normalize a string to title case, stripping whitespace.
    Returns None if value is falsy.
    """
    if value is None:
        return None
    v = str(value).strip()
    return v.title() if v else None


def most_preferred_spice_level(city: str, user_interactions: List[Dict]) -> Dict:
    """
    Determine the most preferred spice level within a given city.

    Parameters
    ----------
    city : str
        Target city to analyze.
    user_interactions : list[dict]
        List of interactions with keys:
        - city: str
        - spice_level: str (e.g., "Mild", "Moderate", "Very Spicy")
        - engagement_score: float in [0.0, 1.0]

    Logic
    -----
    - Filter records by city
    - Group by spice_level
    - Weight counts using engagement_score (sum of engagement per spice level)
    - Preferred spice level is the one with highest weighted engagement
    - Confidence score is the fraction of the winning level's weight over total

    Returns
    -------
    dict:
        {
            "city": "<City>",
            "preferred_spice_level": "<Level or None>",
            "confidence_score": <float in [0,1]>
        }
    """
    normalized_city = _normalize_string(city) or ""
    if not isinstance(user_interactions, list):
        return {"city": normalized_city, "preferred_spice_level": None, "confidence_score": 0.0}

    # Create DataFrame and normalize relevant fields
    df = pd.DataFrame(user_interactions)
    if df.empty:
        return {"city": normalized_city, "preferred_spice_level": None, "confidence_score": 0.0}

    # Normalize city and spice_level columns
    df["city_norm"] = df.get("city", "").astype(str).str.strip().str.title()
    df["spice_level_norm"] = df.get("spice_level", "").astype(str).str.strip().str.title()

    # Engagement score sanitization: allow raw scores for weighting
    eng = df.get("engagement_score", pd.Series(dtype=float)).astype(float)
    df["engagement_score_clamped"] = eng.fillna(0.0)

    city_df = df[df["city_norm"] == normalized_city]
    if city_df.empty:
        return {"city": normalized_city, "preferred_spice_level": None, "confidence_score": 0.0}

    # Weighted aggregation by spice level
    agg = (
        city_df.groupby("spice_level_norm")["engagement_score_clamped"]
        .sum()
        .reset_index(name="weighted_engagement")
    )

    if agg.empty:
        return {"city": normalized_city, "preferred_spice_level": None, "confidence_score": 0.0}

    total_weight = float(agg["weighted_engagement"].sum())
    # Avoid division by zero
    if total_weight <= 0.0:
        # If total weight is 0 (all engagement scores are 0), fallback to frequency count
        count_agg = city_df.groupby("spice_level_norm").size().reset_index(name="count")
        if count_agg.empty:
             return {"city": normalized_city, "preferred_spice_level": None, "confidence_score": 0.0}
        
        preferred_row = count_agg.sort_values(by="count", ascending=False).iloc[0]
        total_count = count_agg["count"].sum()
        confidence = float(preferred_row["count"]) / total_count if total_count > 0 else 0.0
        
        return {
            "city": normalized_city,
            "preferred_spice_level": preferred_row["spice_level_norm"],
            "confidence_score": round(confidence, 4),
        }

    preferred_row = agg.sort_values(by="weighted_engagement", ascending=False).iloc[0]
    confidence = float(preferred_row["weighted_engagement"]) / total_weight

    return {
        "city": normalized_city,
        "preferred_spice_level": preferred_row["spice_level_norm"],
        "confidence_score": round(confidence, 4),
    }


def most_preferred_dietary(city: str, user_interactions: List[Dict]) -> Dict:
    """
    Determine the most preferred dietary preference within a given city.
    """
    normalized_city = _normalize_string(city) or ""
    if not isinstance(user_interactions, list):
        return {"city": normalized_city, "preferred_dietary": None, "confidence_score": 0.0}

    df = pd.DataFrame(user_interactions)
    if df.empty:
        return {"city": normalized_city, "preferred_dietary": None, "confidence_score": 0.0}

    df["city_norm"] = df.get("city", "").astype(str).str.strip().str.title()
    df["dietary_norm"] = df.get("dietary", "").astype(str).str.strip().str.title()
    
    eng = df.get("engagement_score", pd.Series(dtype=float)).astype(float)
    df["engagement_score_clamped"] = eng.fillna(0.0)

    city_df = df[df["city_norm"] == normalized_city]
    if city_df.empty:
        return {"city": normalized_city, "preferred_dietary": None, "confidence_score": 0.0}

    agg = (
        city_df.groupby("dietary_norm")["engagement_score_clamped"]
        .sum()
        .reset_index(name="weighted_engagement")
    )

    if agg.empty:
        return {"city": normalized_city, "preferred_dietary": None, "confidence_score": 0.0}

    total_weight = float(agg["weighted_engagement"].sum())
    if total_weight <= 0.0:
        count_agg = city_df.groupby("dietary_norm").size().reset_index(name="count")
        if count_agg.empty:
             return {"city": normalized_city, "preferred_dietary": None, "confidence_score": 0.0}
        
        preferred_row = count_agg.sort_values(by="count", ascending=False).iloc[0]
        total_count = count_agg["count"].sum()
        confidence = float(preferred_row["count"]) / total_count if total_count > 0 else 0.0
        
        return {
            "city": normalized_city,
            "preferred_dietary": preferred_row["dietary_norm"],
            "confidence_score": round(confidence, 4),
        }

    preferred_row = agg.sort_values(by="weighted_engagement", ascending=False).iloc[0]
    confidence = float(preferred_row["weighted_engagement"]) / total_weight

    return {
        "city": normalized_city,
        "preferred_dietary": preferred_row["dietary_norm"],
        "confidence_score": round(confidence, 4),
    }


def price_sensitivity_analysis(deals: List[Dict], interactions: List[Dict]) -> Dict:
    """
    Analyze price sensitivity using a simple Linear Regression model.

    Parameters
    ----------
    deals : list[dict]
        Each dict contains:
        - deal_id: int/str
        - price: float/int
    interactions : list[dict]
        Each dict contains:
        - deal_id: int/str
        - engagement_score: float in [0.0, 1.0]

    Steps
    -----
    - Merge deal price with engagement_score on deal_id
    - Train LinearRegression with X=price, y=engagement_score
    - Compute Pearson correlation between price and engagement

    Decision
    --------
    - If correlation < 0: suggest price reduction (10%)
    - If correlation >= 0: suggest keeping price

    Returns
    -------
    dict:
        {
            "correlation": <float>,
            "suggestion": <str>
        }
    """
    df_int = pd.DataFrame(interactions)

    if df_int.empty:
        return {
            "correlation": 0.0,
            "suggestion": "Insufficient data to analyze price sensitivity.",
        }

    # Check if price is already in interactions (new logic from analytics_runner)
    if "price" in df_int.columns:
        # Use stored price snapshot directly
        df_int["price"] = pd.to_numeric(df_int["price"], errors="coerce").fillna(np.nan)
        df_int["engagement_score"] = pd.to_numeric(df_int["engagement_score"], errors="coerce").fillna(0)
        merged = df_int[["price", "engagement_score"]].dropna()
    else:
        # Legacy Fallback: Join with deals
        df_deals = pd.DataFrame(deals)
        if df_deals.empty:
             return {
                "correlation": 0.0,
                "suggestion": "Insufficient data to analyze price sensitivity.",
            }

        # Ensure consistent types
        df_deals["deal_id"] = df_deals["deal_id"].astype(str)
        df_int["deal_id"] = df_int["deal_id"].astype(str)

        # Sanitize inputs
        df_deals["price"] = pd.to_numeric(df_deals["price"], errors="coerce").fillna(np.nan)
        # User Requirement: Use engagement count as interaction strength (no clamping)
        df_int["engagement_score"] = pd.to_numeric(df_int["engagement_score"], errors="coerce").fillna(0)

        merged = pd.merge(df_deals[["deal_id", "price"]], df_int[["deal_id", "engagement_score"]], on="deal_id", how="inner")
        merged = merged.dropna(subset=["price", "engagement_score"])

    if merged.empty:
        return {
            "correlation": 0.0,
            "suggestion": "Insufficient real data (no interactions recorded).",
        }

    # User Requirement: Return 0.0 only if fewer than 2 unique prices with non-zero engagement
    unique_prices = merged["price"].nunique()
    if unique_prices < 2:
         return {
            "correlation": 0.0,
            "suggestion": "Insufficient price variance to analyze sensitivity (need at least 2 different price points with engagement).",
        }

    # Linear Regression
    X = merged["price"].to_numpy().reshape(-1, 1)
    y = merged["engagement_score"].to_numpy()
    try:
        model = LinearRegression()
        model.fit(X, y)
    except Exception:
        # Fallback in pathological data scenarios
        pass

    # Pearson correlation
    corr_matrix = np.corrcoef(merged["price"], merged["engagement_score"])
    correlation = float(corr_matrix[0, 1]) if corr_matrix.shape == (2, 2) else 0.0

    if math.isnan(correlation):
        correlation = 0.0

    if correlation < 0:
        suggestion = (
            "Engagement decreases as price increases. Consider reducing prices by 10% to improve customer interaction."
        )
    else:
        suggestion = "Price appears non-detrimental to engagement. Consider keeping current pricing."

    return {
        "correlation": round(correlation, 4),
        "suggestion": suggestion,
    }


def process_user_ai_request(form_data: Dict) -> Dict:
    """
    Validate, normalize, and prepare user request payload for recommendation engine.

    Parameters
    ----------
    form_data : dict
        Example:
        {
          "cuisines": ["Pakistani", "BBQ"],
          "spice_level": "Moderate",
          "budget_range": "500-1500",
          "dietary": "None",
          "city": "Lahore"
        }

    Logic
    -----
    - Validate presence and types of fields
    - Normalize string values (title case, trimmed)
    - Parse budget_range into numeric min/max

    Returns
    -------
    dict:
        {
          "valid": bool,
          "errors": list[str],
          "cuisines": list[str],
          "spice_level": str|None,
          "budget_min": int|None,
          "budget_max": int|None,
          "dietary": str|None,
          "city": str|None
        }
    """
    errors: List[str] = []

    # Cuisines
    cuisines_raw = form_data.get("cuisines")
    if isinstance(cuisines_raw, list):
        cuisines = []
        for c in cuisines_raw:
            norm = _normalize_string(c)
            if norm:
                cuisines.append(norm)
        cuisines = list(dict.fromkeys(cuisines))  # de-duplicate
    else:
        cuisines = []
        errors.append("cuisines must be a list")

    # Spice Level / Dietary / City
    spice_level = _normalize_string(form_data.get("spice_level"))
    dietary = _normalize_string(form_data.get("dietary")) or "None"
    city = _normalize_string(form_data.get("city"))

    # Budget parsing
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    budget_raw = form_data.get("budget_range")
    if isinstance(budget_raw, str):
        parts = budget_raw.strip().split("-")
        if len(parts) == 2:
            try:
                budget_min = int(float(parts[0].strip()))
                budget_max = int(float(parts[1].strip()))
                if budget_min < 0 or budget_max < 0 or budget_min > budget_max:
                    errors.append("budget_range values must be non-negative and min<=max")
                    budget_min, budget_max = None, None
            except ValueError:
                errors.append("budget_range must be parseable as 'min-max'")
        else:
            errors.append("budget_range must be in 'min-max' format")
    else:
        errors.append("budget_range must be a string")

    valid = len(errors) == 0
    return {
        "valid": valid,
        "errors": errors,
        "cuisines": cuisines,
        "spice_level": spice_level,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "dietary": dietary,
        "city": city,
    }


def generate_manager_insight_summary(
    city: str,
    user_interactions: List[Dict],
    deals: List[Dict],
    interactions: List[Dict],
) -> str:
    """
    Generate a business-friendly insight summary for the Manager Dashboard.

    Includes:
    - City spice preference (with confidence)
    - Price sensitivity (correlation and recommendation)

    Parameters
    ----------
    city : str
        Target city for spice preference.
    user_interactions : list[dict]
        Interactions with city, spice_level, engagement_score.
    deals : list[dict]
        Deals with deal_id and price.
    interactions : list[dict]
        Interactions with deal_id and engagement_score.

    Returns
    -------
    str:
        Plain-English insight paragraph.
    """
    if not user_interactions and not interactions:
        return "No real user preference data available yet"

    spice_pref = most_preferred_spice_level(city, user_interactions)
    dietary_pref = most_preferred_dietary(city, user_interactions)
    price_insight = price_sensitivity_analysis(deals, interactions)

    preferred_level = spice_pref.get("preferred_spice_level")
    preferred_dietary = dietary_pref.get("preferred_dietary")
    
    lines = []
    
    if preferred_level:
        confidence = spice_pref.get("confidence_score", 0.0)
        confidence_pct = f"{round(confidence * 100, 1)}%"
        lines.append(f"In {spice_pref.get('city', city)}, customers show a preference for '{preferred_level}' spice level (confidence {confidence_pct}).")
    else:
        lines.append(f"In {city}, insufficient data to determine spice preference.")

    if preferred_dietary and str(preferred_dietary).lower() != "none":
        conf_d = dietary_pref.get("confidence_score", 0.0)
        conf_d_pct = f"{round(conf_d * 100, 1)}%"
        lines.append(f"Most common dietary requirement: {preferred_dietary} ({conf_d_pct}).")

    corr = price_insight.get("correlation", 0.0)
    suggestion = price_insight.get("suggestion", "")

    lines.append(f"Price sensitivity correlation: {corr:+.2f}. {suggestion}")
    
    if preferred_level:
        lines.append("Consider aligning featured deals with the preferred spice level and revisiting pricing where it helps improve engagement.")
        
    return " ".join(lines)

