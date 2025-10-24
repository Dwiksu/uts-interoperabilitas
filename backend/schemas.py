from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- Skema untuk Participant ---

class ParticipantBase(BaseModel):
    name: str
    email: str

class ParticipantCreate(ParticipantBase):
    event_id: int

class Participant(ParticipantBase):
    id: int
    event_id: int

    class Config:
        orm_mode = True # Untuk membaca data dari model ORM

# --- Skema untuk Event ---

class EventBase(BaseModel):
    title: str
    date: date
    location: str
    quota: int

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    # Saat membaca event, tampilkan juga daftar pesertanya
    participants: List[Participant] = []

    class Config:
        orm_mode = True

# --- Skema untuk Auth (Bonus) ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None