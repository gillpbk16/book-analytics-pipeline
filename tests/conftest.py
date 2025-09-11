import pytest
import os
from fastapi.testclient import TestClient


os.environ["USE_MONGO"] = "false"

import api.db
api.db.load_books.cache_clear()

from api.main import app 


@pytest.fixture
def sample_books():
    return [
        {"id": "1", "title": "The Cat",              "url": "u1", "price": 10.0, "availability": "In stock"},
        {"id": "2", "title": "Dog Days",             "url": "u2", "price": 25.5, "availability": "In stock"},
        {"id": "3", "title": "Bird Box",             "url": "u3", "price": 40.0, "availability": "Out of stock"},
        {"id": "4", "title": "Another Cat Tale",     "url": "u4", "price": None, "availability": "In stock"},
    ]

@pytest.fixture(autouse=True)
def patch_loader(monkeypatch, sample_books):
    monkeypatch.setattr("api.main.load_books", lambda: sample_books, raising=True)

@pytest.fixture
def client():
    return TestClient(app)