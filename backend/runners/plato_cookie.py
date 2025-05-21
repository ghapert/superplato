import os
import json

COOKIE_DIR = os.path.join(os.path.dirname(__file__), "cookies")

async def save_cookies(context, user_id):
    # 1. cookies 폴더 없으면 자동 생성
    os.makedirs(COOKIE_DIR, exist_ok=True)
    path = os.path.join(COOKIE_DIR, f"cookies-{user_id}.json")
    raw_json = await context.storage_state()
    # storage_state()가 dict가 아니면 json.dumps로 변환
    if isinstance(raw_json, str):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(raw_json)
    else:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(raw_json, f, ensure_ascii=False, indent=2)

async def load_cookies_if_exist(browser, user_id):
    path = os.path.join(COOKIE_DIR, f"cookies-{user_id}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            try:
                storage_state = json.load(f)
            except Exception:
                # 파일이 비었거나 json이 아님
                return None
        try:
            context = await browser.new_context(storage_state=storage_state)
            return context
        except Exception:
            # storage_state 구조가 꼬였을 때
            return None
    return None