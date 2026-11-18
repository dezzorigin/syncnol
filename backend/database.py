import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Baca kunci dari .env
load_dotenv()
# Tanpa DATABASE_URL (mis. jalan lokal tanpa Postgres), pakai SQLite file
# lokal — sama seperti syncnol_local.db yang dipakai saat pengembangan awal.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./syncnol_local.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Nyalain mesin penghubung ke database
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class buat cetakan tabel kita nanti
Base = declarative_base()
