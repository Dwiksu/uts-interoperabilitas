-- Script untuk membuat tabel di SQLite
-- (Meskipun SQLAlchemy akan membuatnya otomatis, ini sesuai permintaan)

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    quota INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    event_id INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events (id)
);