from sqlalchemy.orm import Session
from . import models, schemas
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

# --- CRUD untuk Event ---

def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).offset(skip).limit(limit).all()

def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event_id: int, event: schemas.EventCreate):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    # Update data
    update_data = event.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    db.delete(db_event)
    db.commit()
    return db_event

# --- CRUD untuk Participant ---

def get_participants(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Participant).offset(skip).limit(limit).all()

def create_participant(db: Session, participant: schemas.ParticipantCreate):
    # Cek apakah event ada
    db_event = get_event(db, participant.event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Cek kuota
    if len(db_event.participants) >= db_event.quota:
        raise HTTPException(status_code=400, detail="Event is full, quota reached")

    try:
        db_participant = models.Participant(**participant.dict())
        db.add(db_participant)
        db.commit()
        db.refresh(db_participant)
        return db_participant
    except IntegrityError:
        # Ini terjadi jika email sudah terdaftar (karena UNIQUE constraint)
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")