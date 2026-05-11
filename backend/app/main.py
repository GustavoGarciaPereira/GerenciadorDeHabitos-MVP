"""FastAPI application entry point — CORS, router registration, and table creation."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.habits import router as habits_router
from .database import engine, Base

# Create all tables on startup (idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habit Tracker MVP", version="0.1.0")

# CORS — allow SolidJS dev server origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habits_router)


@app.get("/health")
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}
