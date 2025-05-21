from firebase_admin import credentials, initialize_app, _apps
from pathlib import Path

cred_path = Path(__file__).parent.parent / "credentials/firebase-service-account.json"

def init_firebase():
    if not _apps:
        cred = credentials.Certificate(str(cred_path))
        initialize_app(cred)