from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

# Import semua komponen
from . import crud, models, schemas, auth
from .database import SessionLocal, engine, get_db

# Buat tabel di database (jika belum ada)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus Event Registration Platform")

# --- CORS Middleware ---
# Mengizinkan frontend (yang berjalan di origin berbeda) untuk mengakses API
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5500", # Port default Live Server VS Code
    "null", # Mengizinkan akses dari file:// (saat membuka index.html langsung)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin (untuk kemudahan development)
    allow_credentials=True,
    allow_methods=["*"], # Izinkan semua metode (GET, POST, dll)
    allow_headers=["*"], # Izinkan semua header
)

# === ENDPOINT OTENTIKASI (BONUS) ===

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint login untuk admin."""
    is_admin = auth.authenticate_admin(form_data.username, form_data.password)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Buat token JWT
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/admin/me")
async def read_admin_me(current_admin: dict = Depends(auth.get_current_admin)):
    """Endpoint tes untuk mengecek apakah token valid."""
    return current_admin

# === ENDPOINT EVENT ===
# Endpoint ini diproteksi, hanya admin (dengan token valid) yang bisa akses

@app.post("/events", response_model=schemas.Event, status_code=status.HTTP_201_CREATED)
def create_event(
    event: schemas.EventCreate, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(auth.get_current_admin) # Proteksi
):
    return crud.create_event(db=db, event=event)

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int, 
    event: schemas.EventCreate, 
    db: Session = Depends(get_db),
    admin: dict = Depends(auth.get_current_admin) # Proteksi
):
    db_event = crud.update_event(db, event_id, event)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@app.delete("/events/{event_id}", response_model=schemas.Event)
def delete_event(
    event_id: int, 
    db: Session = Depends(get_db),
    admin: dict = Depends(auth.get_current_admin) # Proteksi
):
    db_event = crud.delete_event(db, event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

# === ENDPOINT PUBLIK ===
# Endpoint ini bisa diakses siapa saja tanpa token

@app.get("/events", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Tampilkan semua event (Publik)."""
    events = crud.get_events(db, skip=skip, limit=limit)
    return events

@app.post("/register", response_model=schemas.Participant, status_code=status.HTTP_201_CREATED)
def register_for_event(
    participant: schemas.ParticipantCreate, 
    db: Session = Depends(get_db)
):
    """Daftar ke sebuah event (Publik)."""
    try:
        return crud.create_participant(db=db, participant=participant)
    except HTTPException as e:
        raise e # Tampilkan error (misal: "Event is full" atau "Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/participants", response_model=List[schemas.Participant])
def read_participants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Tampilkan semua peserta (Publik)."""
    participants = crud.get_participants(db, skip=skip, limit=limit)
    return participants