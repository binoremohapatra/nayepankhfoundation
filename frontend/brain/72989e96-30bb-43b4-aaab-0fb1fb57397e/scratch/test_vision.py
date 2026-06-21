import sys
import os

# Add maveai backend to path
sys.path.append(r'd:\maveai\backend')

try:
    from utils.shared_state import update_vision_context, get_vision_context
    print("SUCCESS: shared_state imports successful")
    
    update_vision_context("Testing J.A.R.V.I.S. vision context")
    print(f"SUCCESS: Context update: {get_vision_context()}")
    
    import google.generativeai as genai
    print("SUCCESS: google-generativeai import successful")
    
    from PIL import Image
    print("SUCCESS: Pillow (PIL) import successful")
    
    print("\nFINAL: All hybrid vision dependencies and shared state logic are working correctly!")
except Exception as e:
    print(f"ERROR: Test failed: {e}")
