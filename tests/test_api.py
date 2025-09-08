def get_items(response):
    data = response.json()
    assert "items" in data
    return data["items"]

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_books_basic(client):
    r = client.get("/books")
    assert r.status_code == 200
    items = get_items(r)
    assert isinstance(items, list)
    assert len(items) == 4
    assert {"id", "title", "url", "price", "availability"}.issubset(items[0].keys())


def test_books_q_filter(client):
    r = client.get("/books", params={"q":"cat"})
    title = [item["title"].lower() for item in get_items(r)]
    assert title == ["the cat", "another cat tale"]


def test_books_price_min(client):
    r = client.get("/books", params={"price_min": 20})
    prices = [item["price"] for item in get_items(r)]
    assert prices == [25.5, 40.0]

def test_books_price_max(client):
    r = client.get("/books", params={"price_max": 20})
    prices = [item["price"] for item in get_items(r)]
    assert prices == [10.0]

def test_books_availability(client):
    r = client.get("/books", params={"availability": "in stock"})
    ids = [item["id"] for item in get_items(r)]
    assert ids == ["1", "2", "4"]


def test_books_sort_price_asc(client):
    r = client.get("/books", params={"sort": "price_asc"})
    prices = [item["price"] for item in get_items(r)]
    assert prices[:3] == [10.0, 25.5, 40.0]
    
def test_books_pagination(client):
    r1 = client.get("/books", params={"limit": 2, "offset": 0, "sort": "title_asc"})
    r2 = client.get("/books", params={"limit": 2, "offset": 2, "sort": "title_asc"})
    titles1 = [item["title"] for item in get_items(r1)]
    titles2 = [item["title"] for item in get_items(r2)]
    assert len(set(titles1).intersection(titles2)) == 0
    assert len(titles1) == 2 and len(titles2) == 2

def test_analytics(client):
    r = client.get("/analytics/availability")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 4
    bucket_map = {item["label"]: item["count"] for item in data["buckets"]}
    assert bucket_map.get("in stock") == 3
    assert bucket_map.get("out of stock") == 1


def test_books_combined_filters(client):
    r = client.get("/books", params={"q": "cat", "price_min": 5, "price_max": 15, "availability": "in stock"})
    items = [item["id"] for item in get_items(r)]
    assert items == ["1"]
    

def test_book_offset_beyond_total(client):
    r = client.get("/books", params={"limit":10, "offset": 999})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 4
    assert data["items"] == []


def test_book_pricemin_greater_than_pricemax(client):
    r = client.get("/books", params={"price_min": 30, "price_max": 20})
    data = r.json()
    assert data["items"] == []


def test_price_buckets_tiny_and_large(client, monkeypatch):
    custom = [
        {"id": "a", "title": "A", "url": "ua", "price": 0.0,  "availability": "in stock"},
        {"id": "b", "title": "B", "url": "ub", "price": 5.0,  "availability": "in stock"},
        {"id": "c", "title": "C", "url": "uc", "price": 10.0, "availability": "in stock"},
        {"id": "d", "title": "D", "url": "ud", "price": 15.0, "availability": "in stock"},
    ]
    
    monkeypatch.setattr("api.main.load_books", lambda: custom,  raising=True)

    r_small = client.get("/analytics/price-buckets", params={"bucket_size": 5})
    assert r_small.status_code == 200
    buckets_small = r_small.json()["buckets"]
    counts = [item["count"] for item in buckets_small]
    assert counts == [1,1,1,1]

    r_large = client.get("/analytics/price-buckets", params={"bucket_size": 100})
    assert r_large.status_code == 200
    buckets_large = r_large.json()["buckets"]
    assert len(buckets_large) == 1
    assert buckets_large[0]["count"] == len(custom)


def test_title_words_top1_with_punctuation(client, monkeypatch):
    custom = [
        {"id": "1", "title": "Cats & Dogs!!!",       "url": "u1", "price": 12.0, "availability": "in stock"},
        {"id": "2", "title": "Cats: A Tale",         "url": "u2", "price": 9.0,  "availability": "in stock"},
        {"id": "3", "title": "Dogs? Yes, dogs.",     "url": "u3", "price": 7.0,  "availability": "in stock"},
    ]
    monkeypatch.setattr("api.main.load_books", lambda: custom, raising=True)

    r = client.get("/analytics/title-words", params={"top_n": 1})
    assert r.status_code == 200
    data = r.json()
    assert "top" in data and len(data["top"]) == 1
    assert data["top"][0]["word"] == "dogs"
    assert data["top"][0]["count"] == 3