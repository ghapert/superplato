from firebase_admin import auth as firebase_auth
from config.firebase_config import init_firebase

def verify_firebase_token(token: str):
    init_firebase()
    return firebase_auth.verify_id_token(token)