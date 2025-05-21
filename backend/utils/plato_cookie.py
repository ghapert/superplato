import os
import json
from cryptography.fernet import Fernet

COOKIE_DIR = "cookies"
os.makedirs(COOKIE_DIR, exist_ok=True)  # 이 줄 추가
FERNET_KEY = os.environ["FERNET_KEY"]
fernet = Fernet(FERNET_KEY)

async def save_cookies(context, user_id):
    path = os.path.join(COOKIE_DIR, f"cookies-{user_id}.json")
    raw_json = await context.storage_state()  # await is necessary here
    encrypted = fernet.encrypt(json.dumps(raw_json).encode())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(encrypted)

async def load_cookies_if_exist(browser, user_id):
    path = os.path.join(COOKIE_DIR, f"cookies-{user_id}.json")
    if os.path.exists(path):
        with open(path, 'rb') as f:
            encrypted = f.read()
        decrypted = json.loads(fernet.decrypt(encrypted).decode())
        context = await browser.new_context(storage_state=decrypted)
        return context
    return None