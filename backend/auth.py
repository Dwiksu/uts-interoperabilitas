from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from . import schemas

# --- Konfigurasi ---
SECRET_KEY = "INI_ADALAH_SECRET_KEY_YANG_SANGAT_RAHASIA_HARUS_DIGANTI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- User Admin (Hardcoded) ---
# Di aplikasi nyata, ini akan ada di database
FAKE_ADMIN_USER = "admin"
# Password adalah "adminpass"
FAKE_ADMIN_PASSWORD_HASH = "$2b$12$EixZaYVK1G.1uPZqS.FLd.y.EiYy.N.Q5y0k.V.g.j/z.O.k.w.Z."

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # URL /token ada di main.py

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_admin(username, password):
    """Cek apakah username dan password admin valid."""
    if username != FAKE_ADMIN_USER:
        return False
    if not password == 'adminpass':
        return False
    return True

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    """Dependency untuk memvalidasi token di endpoint yang diproteksi."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Cek apakah user di token adalah admin
    if token_data.username != FAKE_ADMIN_USER:
         raise credentials_exception
    
    return {"username": token_data.username}