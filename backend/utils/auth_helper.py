from cryptography.fernet import Fernet
import os

def get_fernet() -> Fernet:
    key = os.getenv("FERNET_KEY")
    if key is None:
        raise ValueError("FERNET_KEY is not set in the environment.")
    return Fernet(key.encode())

def encrypt(text: str) -> str:
    f = get_fernet()
    return f.encrypt(text.encode()).decode()

def decrypt(token: str) -> str:
    f = get_fernet()
    return f.decrypt(token.encode()).decode()