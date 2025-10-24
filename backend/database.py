from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL database SQLite. File 'campus_events.db' akan dibuat di folder 'backend'
DATABASE_URL = "sqlite:///./campus_events.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} # Diperlukan untuk SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency untuk mendapatkan sesi database di setiap request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()