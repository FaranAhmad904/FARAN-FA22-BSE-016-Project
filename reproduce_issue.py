
import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "ai_service"))

from ai_service.analytics_runner import build_deal_interactions
from ai_service.manager_ai_analytics import price_sensitivity_analysis

# Scenario:
# Deal 1: Price 100, View=1 (Score 1)
# Deal 2: Price 100, View=1 (Score 1)
# Deal 3: Price 100, View=1 (Score 1)
# All same price -> Variance is 0. Unique prices = 1.
# Expected: "Insufficient price variance"

prefs_same_price = [
    {"dealInteractions": [{"deal_id": "d1", "dealPrice": 100, "actions": {"view": 1}}]},
    {"dealInteractions": [{"deal_id": "d2", "dealPrice": 100, "actions": {"view": 1}}]},
]
deals_same_price = [
    {"deal_id": "d1", "price": 100},
    {"deal_id": "d2", "price": 100},
]

print("--- Scenario 1: Same Prices ---")
di1 = build_deal_interactions(prefs_same_price, deals_same_price)
res1 = price_sensitivity_analysis(deals_same_price, di1)
print(f"Unique Prices: {len(set(d['price'] for d in di1))}")
print("Result:", res1)


# Scenario 2: Different Prices, but one has 0 engagement (if that's possible?)
# If actions is empty/missing -> score 0 -> filtered out.
# Deal 1: Price 100, Score 1
# Deal 2: Price 200, Score 0
# Result: Only Deal 1 remains -> Unique prices = 1.

prefs_zero_score = [
    {"dealInteractions": [{"deal_id": "d1", "dealPrice": 100, "actions": {"view": 1}}]},
    {"dealInteractions": [{"deal_id": "d2", "dealPrice": 200, "actions": {}}]}, # No actions, no fallback
]
deals_zero_score = [
    {"deal_id": "d1", "price": 100},
    {"deal_id": "d2", "price": 200},
]

print("\n--- Scenario 2: Different Prices, One Zero Score ---")
di2 = build_deal_interactions(prefs_zero_score, deals_zero_score)
print("Interactions:", di2)
res2 = price_sensitivity_analysis(deals_zero_score, di2)
print("Result:", res2)

# Scenario 3: Missing dealPrice snapshot, fallback works?
# Deal 1: Price 100 (Snapshot)
# Deal 2: No Snapshot. Current Price 200.
prefs_missing_snap = [
    {"dealInteractions": [{"deal_id": "d1", "dealPrice": 100, "actions": {"view": 1}}]},
    {"dealInteractions": [{"deal_id": "d2", "actions": {"view": 1}}]}, # Missing dealPrice
]
deals_missing_snap = [
    {"deal_id": "d1", "price": 100},
    {"deal_id": "d2", "price": 200},
]

print("\n--- Scenario 3: Missing Snapshot, Fallback ---")
di3 = build_deal_interactions(prefs_missing_snap, deals_missing_snap)
print("Interactions:", di3)
res3 = price_sensitivity_analysis(deals_missing_snap, di3)
print("Result:", res3)
