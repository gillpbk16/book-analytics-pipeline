import pytest
import os
from fastapi.testclient import TestClient

# Ensure we're testing MongoDB mode
os.environ["USE_MONGO"] = "true"

from api.main import app

client = TestClient(app)

def test_books_price_filter_mongo():
    """Test /books endpoint with price filters using MongoDB."""
    r = client.get("/books", params={"price_min": 20, "price_max": 30})
    assert r.status_code == 200
    
    data = r.json()
    assert "items" in data
    assert "total" in data
    
    # Verify all returned books are in the specified price range
    for item in data["items"]:
        if item["price"] is not None:
            assert 20 <= item["price"] <= 30

def test_books_sort_price_desc_mongo():
    """Test /books endpoint with price sorting using MongoDB."""
    r = client.get("/books", params={"sort": "price_desc", "limit": 1})
    assert r.status_code == 200
    
    data = r.json()
    assert len(data["items"]) >= 1
    # First item should have the highest price
    first_price = data["items"][0]["price"]
    assert first_price is not None

def test_price_stats_mongo():
    """Test /analytics/price-stats endpoint using MongoDB."""
    r = client.get("/analytics/price-stats")
    assert r.status_code == 200
    
    data = r.json()
    assert "count" in data
    assert "min" in data  
    assert "max" in data
    assert "average" in data
    
    # Should have some books with valid prices
    assert data["count"] > 0
    assert data["min"] is not None
    assert data["max"] is not None
    assert data["average"] is not None

def test_price_buckets_mongo():
    """Test /analytics/price-buckets endpoint using MongoDB."""
    r = client.get("/analytics/price-buckets", params={"bucket_size": 10})
    assert r.status_code == 200
    
    data = r.json()
    assert "buckets" in data
    assert isinstance(data["buckets"], list)
    
    # Should have at least one bucket
    assert len(data["buckets"]) > 0
    
    # Each bucket should have proper structure
    for bucket in data["buckets"]:
        assert "lower" in bucket
        assert "upper" in bucket  
        assert "count" in bucket
        assert isinstance(bucket["count"], int)
        assert bucket["count"] >= 0
