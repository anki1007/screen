import os
import time
import random
from io import StringIO
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

app = Flask(__name__)
CORS(app)

driver = None

def init_driver():
    """Initializes Headless Chrome for Cloud Environments"""
    global driver
    if driver is None:
        print("Initializing Chrome...")
        chrome_options = Options()
        chrome_options.add_argument("--headless") 
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # --- NEW FIX FOR RENDER ---
        # If we are running on Render, use the Chrome binary we downloaded
        if os.environ.get("RENDER"):
            chrome_options.binary_location = "/opt/render/project/.render/chrome/opt/google/chrome/chrome"
        # --------------------------

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        print("Chrome Initialized.")

@app.route('/', methods=['GET'])
def home():
    return "Screen API is Online", 200

@app.route('/login', methods=['POST'])
def login():
    global driver
    data = request.json
    try:
        init_driver()
        driver.get("https://www.screener.in/login/")
        time.sleep(1)
        
        # Login Process
        driver.find_element(By.NAME, "username").send_keys(data['username'])
        driver.find_element(By.NAME, "password").send_keys(data['password'])
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(3)
        if "login" not in driver.current_url:
            return jsonify({"status": "success", "msg": "Login Successful"})
        else:
            return jsonify({"status": "error", "msg": "Invalid Credentials"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/screens', methods=['GET'])
def get_screens():
    global driver
    if not driver: return jsonify({"error": "Login required"}), 401
    
    try:
        driver.get("https://www.screener.in/screens/")
        time.sleep(2)
        
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/screens/']")
        screens = []
        for l in links:
            txt = l.text.strip()
            if txt:
                screens.append({"name": txt, "url": l.get_attribute("href")})
        
        # Deduplicate
        unique = list({v['url']:v for v in screens}.values())
        return jsonify(unique)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/run', methods=['POST'])
def run_screen():
    global driver
    if not driver: return jsonify({"error": "Login required"}), 401
    
    url = request.json.get('url')
    try:
        driver.get(url)
        time.sleep(random.uniform(2, 4))
        
        dfs = pd.read_html(StringIO(driver.page_source))
        if dfs:
            clean_data = dfs[0].fillna("").to_dict(orient='records')
            return jsonify(clean_data)
        return jsonify([])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)