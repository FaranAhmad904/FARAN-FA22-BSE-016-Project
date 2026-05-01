
import unittest
from manager_ai_analytics import most_preferred_spice_level, price_sensitivity_analysis
import pandas as pd

class TestManagerAnalytics(unittest.TestCase):
    def test_spice_preference(self):
        # Mock data based on new logic (raw engagement scores)
        interactions = [
            {"city": "Lahore", "spice_level": "Moderate", "engagement_score": 10.0},
            {"city": "Lahore", "spice_level": "Very Spicy", "engagement_score": 5.0},
            {"city": "Karachi", "spice_level": "Mild", "engagement_score": 20.0},
        ]
        
        # Test Lahore
        result = most_preferred_spice_level("Lahore", interactions)
        self.assertEqual(result["preferred_spice_level"], "Moderate")
        self.assertAlmostEqual(result["confidence_score"], 10.0 / 15.0)

    def test_price_sensitivity(self):
        # Mock data: Higher price -> Lower engagement (negative correlation)
        deals = [
            {"deal_id": "1", "price": 100},
            {"deal_id": "2", "price": 200},
            {"deal_id": "3", "price": 300},
        ]
        interactions = [
            {"deal_id": "1", "engagement_score": 10.0},
            {"deal_id": "2", "engagement_score": 5.0},
            {"deal_id": "3", "engagement_score": 1.0},
        ]
        
        result = price_sensitivity_analysis(deals, interactions)
        self.assertTrue(result["correlation"] < 0)
        self.assertIn("Consider reducing prices", result["suggestion"])

    def test_price_sensitivity_single_point(self):
        # Mock data: Only 1 interaction
        deals = [{"deal_id": "1", "price": 100}]
        interactions = [{"deal_id": "1", "engagement_score": 10.0}]
        
        result = price_sensitivity_analysis(deals, interactions)
        self.assertEqual(result["correlation"], 0.0)
        self.assertIn("Limited data available", result["suggestion"])
        self.assertNotIn("Insufficient data", result["suggestion"])

if __name__ == "__main__":
    unittest.main()
