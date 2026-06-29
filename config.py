import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")

    SQLALCHEMY_DATABASE_URI = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or "sqlite:///footballchannel.db"
    )

    # Clean accidental spaces or wrapping quotes from env values
    SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.strip().strip('"').strip("'")

    # Remove Supabase's extra pooler option if it appears
    SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("&supa=base-pooler.x", "")

    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace(
            "postgres://",
            "postgresql://",
            1
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
