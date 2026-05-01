#!/usr/bin/env python
"""Quick setup check script"""
import sys

print("Python Setup Check")
print("=" * 50)
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print()

# Check required modules
required_modules = ['flask', 'flask_cors', 'pymongo', 'dotenv']

print("Checking required modules:")
print("-" * 50)
all_ok = True
for module in required_modules:
    try:
        if module == 'dotenv':
            import dotenv
            print(f"[OK] {module} (python-dotenv)")
        elif module == 'flask_cors':
            import flask_cors
            print(f"[OK] {module} (flask-cors)")
        else:
            __import__(module)
            print(f"[OK] {module}")
    except ImportError:
        print(f"[MISSING] {module} - NOT INSTALLED")
        all_ok = False

print()
if all_ok:
    print("[SUCCESS] All required modules are installed!")
    print("You can run: python app.py")
else:
    print("[ERROR] Some modules are missing. Install them with:")
    print("  python -m pip install Flask flask-cors pymongo python-dotenv")
    sys.exit(1)

