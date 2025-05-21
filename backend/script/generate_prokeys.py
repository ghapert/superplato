import random
import string
from models.user import ProKey
from database import SessionLocal

def generate_cdkey():
    digits = ''.join(random.choices(string.digits, k=4))
    letters = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"PRO-{digits}-{letters}"

def generate_pro_keys(n=10):
    db = SessionLocal()
    created = 0
    attempts = 0

    while created < n and attempts < n * 5:
        attempts += 1
        key = generate_cdkey()
        if db.query(ProKey).filter_by(key=key).first():
            continue  # 중복 방지
        db.add(ProKey(key=key))
        created += 1
        print(f"[+] Created key: {key}")

    db.commit()
    db.close()
    print(f"✅ 총 {created}개의 키 생성 완료")