from flask import Blueprint, request, jsonify
from transformers import pipeline
import traceback

sentiment_bp = Blueprint('sentiment_bp', __name__)

# Simple, reliable model loading
classifier = None

def load_model():
    global classifier
    try:
        print("DEBUG: Loading sentiment analysis model...")
        # Try the most basic model first
        classifier = pipeline("sentiment-analysis")
        print("DEBUG: Model loaded successfully")
        
        # Test it immediately
        test_text = "This is good"
        test_result = classifier(test_text)[0]
        print(f"DEBUG: Model test - Input: '{test_text}', Output: {test_result}")
        
        return True
        
    except Exception as e:
        print(f"DEBUG: Model loading failed: {e}")
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        return False

# Load model at startup
if not load_model():
    print("DEBUG: CRITICAL - Could not load model, service will not work properly")
    classifier = None

def hybrid_score(result):
    if not result:
        print("DEBUG: No result provided")
        return "neutral", 0.0, 0.0
    
    label = result.get('label', 'NEUTRAL')
    score = result.get('score', 0.0)
    
    print(f"DEBUG: Processing - Label: {label}, Score: {score}")
    
    # Hybrid ML logic
    if label == "POSITIVE":
        weighted = score * 1.2
    elif label == "NEGATIVE":
        weighted = score * -1
    else:
        weighted = 0

    final_sentiment = label.lower()
    print(f"DEBUG: Final - Sentiment: {final_sentiment}, Confidence: {score}, Hybrid: {weighted}")
    
    return final_sentiment, score, weighted

@sentiment_bp.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.json
    text = data.get("text")
    
    print(f"DEBUG: Received request with text: '{text}'")
    print(f"DEBUG: Classifier status: {'Available' if classifier else 'Not Available'}")
    
    if not text or text.strip() == "":
        print("DEBUG: Empty text, returning neutral")
        return jsonify({
            "sentiment": "neutral",
            "confidence": 0.0,
            "hybridScore": 0.0
        })
    
    if not classifier:
        print("DEBUG: No classifier available, returning neutral")
        return jsonify({
            "sentiment": "neutral",
            "confidence": 0.0,
            "hybridScore": 0.0,
            "error": "Model not available"
        })
    
    try:
        print(f"DEBUG: Running classification on: '{text}'")
        result = classifier(text)[0]
        print(f"DEBUG: Classification result: {result}")
        
        sentiment, confidence, hybrid = hybrid_score(result)
        
        response_data = {
            "sentiment": sentiment,
            "confidence": confidence,
            "hybridScore": hybrid
        }
        
        print(f"DEBUG: Returning response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"DEBUG: Classification error: {e}")
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return jsonify({
            "sentiment": "neutral",
            "confidence": 0.0,
            "hybridScore": 0.0,
            "error": str(e)
        })
