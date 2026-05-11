"""
Test fixtures: in-memory SQLite database with per-test rollback,
and a FastAPI TestClient with dependency override.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="function")
def engine():
    """Create a fresh in-memory SQLite engine with all tables."""
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=eng)
    return eng


@pytest.fixture(scope="function")
def db(engine):
    """
    Provide a transactional session that rolls back after each test.
    This keeps tests isolated without manual cleanup.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """
    FastAPI TestClient with `get_db` overridden to inject the test session.
    """
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
