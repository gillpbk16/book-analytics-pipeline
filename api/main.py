# Standard Imports
import logging
import string
from collections import Counter
from typing import Optional

# Third Party Imports
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Local Imports 
from api.db import(
    load_books, DataLoadError, list_books_mongo, USE_MONGO, 
    price_stats_mongo, availability_mongo, price_buckets_mongo
)
from api.models import BookOut, BooksResponse, AvailabilityResponse, PriceStats, PriceBucketsResponse, WordsResponse

"""
Book Analytics Pipeline API

REST API for analyzing book data from web scraping.
Built with FastAPI and supports MongoDB or JSON file storage.
"""

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Book Analytics Pipeline API",
    description=(
        "Lightweight REST API over a static books dataset.\n\n"
        "Use `/books` for searchable, paginated results and `/analytics/*` for quick summaries "
        "(availability counts, price stats/buckets, and frequent title words)."
    ),
    version="3.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True}

@app.get(
    "/health",
    tags=["System"],
    summary="Liveness check",
    description="Returns `{'status': 'ok'}` when the API process is running."
)
def health():
    """Lightweight liveness check.

    Returns:
        {"status": "ok"} when the app is up.
    """
    return {"status": "ok"}

@app.get(
    "/books",
    response_model=BooksResponse,
    tags=["Books"],
    summary="List books",
    description=(
        "Search and filter books. Supports text search on title, numeric price filters, "
        "availability match, sorting, and pagination. Returns a `total` and a page of `items`."
    ),
)
def get_books(
    q: Optional[str] = Query(None, max_length=100),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    availability: Optional[str] = Query(None, max_length=50),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: Optional[str] = Query(None, pattern="^(price_asc|price_desc|title_asc|title_desc)$"),
):
    """Get books with optional search and filtering.

    Args:
        - q: Search text to match in book titles  
        - price_min / price_max: Filter books by price range 
        - availability: Filter by availability status (e.g. "in stock")  
        - limit: Number of books per page (1–100)  
        - offset: Number of books to skip (for pagination)  
        - sort: Sort order - price_asc, price_desc, title_asc or title_desc  

    Returns:
        Dictionary with total count and list of matching books.
    """
    try:
        if USE_MONGO: 
            total, items = list_books_mongo(
                q=q,
                price_min=price_min,
                price_max=price_max,
                availability=availability,
                limit=limit,
                offset=offset,
                sort=sort,
            )
            return {"total": total, "items": [BookOut(**it) for it in items]}
        
        items = load_books()
        if q: 
            q_l = q.lower()
            items = [item for item in items if q_l in item.get("title", "").lower()]

        # Availability Filter
        if availability:
            wanted = availability.strip().lower()
            items = [item for item in items if (item.get("availability") or "").strip().lower() == wanted]

        # Price Filters
        if price_min is not None:
            items = [item for item in items if (item.get("price") is not None and item.get("price") >= price_min)]
        if price_max is not None:
            items = [item for item in items if (item.get("price") is not None and item.get("price") <= price_max)]

        total = len(items)

        # Sorting 
        if sort: 
            if sort.startswith("price_"):
                priced_items = [item for item in items if item.get("price") is not None]
                items = sorted(
                    priced_items, 
                    key=lambda x: x["price"], 
                    reverse=(sort == "price_desc")
                )
            elif sort.startswith("title_"):
                items = sorted(
                    items, 
                    key=lambda x: x.get("title", "").lower(), 
                    reverse=(sort == "title_desc")
                )
       
        # Pagination
        items = items[offset: offset + limit]
        logger.info("GET /books returning %d items (total=%d)", len(items), total)
        
        # Return formatted response
        return {"total": total,
                "items": [BookOut(**item) for item in items],
                } 
    except DataLoadError as e: 
        raise HTTPException(status_code=503, detail=str(e))
    

    

@app.get(
    "/analytics/availability",
    response_model=AvailabilityResponse,
    tags=["Analytics"],
    summary="Availability distribution",
    description="Availability label."
)
def get_availability():
    """Get count of books for each availability status. 

    Returns:
        Dictionary with total books and breakdown by availability
        (e.g., "in stock", "out of stock", etc.)
    """
    try:
        if USE_MONGO:
            return availability_mongo()
        
        items = load_books()
        availability_counts = Counter(
        (item.get("availability") or "unknown").strip().lower() for item in items
        )

        total = sum(availability_counts.values())
        buckets = [{"label": label, "count": count} for label, count in availability_counts.items()]
        return {"total": total, "buckets": buckets}
    except DataLoadError as e:
        raise HTTPException(status_code=503, detail=str(e))
   

@app.get(
    "/analytics/price-stats",
    response_model=PriceStats,
    tags=["Analytics"],
    summary="Price summary stats",
    description="Minimum, maximum, average, and count over prices."
)
def get_price_stats():
    """Get basic price statistics for all books.

    Returns:
        Dictionary with count, minimum, maximum and average price.
    """
    try:
        if USE_MONGO:
            return price_stats_mongo()
        items = load_books()
        prices = [item["price"] for item in items if item.get("price") is not None]
        count = len(prices)
        if count == 0:
            return {"count": 0, "min": None, "max": None, "average": None}
        min_price = min(prices)
        max_price = max(prices)
        average_price = sum(prices) / count
        return {"count": count, "min": min_price, "max": max_price, "average": average_price}
    
    except DataLoadError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/analytics/price-buckets", response_model=PriceBucketsResponse)
def get_price_buckets(bucket_size: float = Query(10.0, gt=0)):
    """Get price distribution in histogram buckets. 

    Args: 
        bucket_size: Width of each price range (e.g., 10.0 for £10 buckets)

    Returns: 
        List of price ranges with count of books in each range
    """
    try: 
        if USE_MONGO:
            return price_buckets_mongo(bucket_size)
        items = load_books()
    except DataLoadError as e:
        raise HTTPException(status_code=503, detail=str(e))

    prices = [item["price"] for item in items if item.get("price") is not None]
    buckets = []
    if not prices:
        return {"buckets": []}
    min_price = min(prices)
    max_price = max(prices)
    num_buckets = int((max_price - min_price) / bucket_size)
    for i in range(num_buckets + 1):
        lower = min_price + i * bucket_size
        upper = lower + bucket_size
        count = sum(1 for price in prices if lower <= price < upper)
        buckets.append({"lower": lower, "upper": upper, "count": count})
    return {"buckets": buckets}

@app.get("/analytics/title-words", response_model=WordsResponse)
def get_title_words(top_n: int = Query(10, ge=1, le=100)):
    """Get most common words used in book titles.

    Args:
        top_n: Number of top words to return (1-100)

    Returns:
        List of words and their frequency counts
    """

    try:
        items = load_books()
    except DataLoadError as e:
        raise HTTPException(status_code=503, detail=str(e))
    word_counter = Counter()
    for item in items:
        title = (item.get("title") or "").lower()
        # remove punctuation, then split
        cleaned = title.translate(str.maketrans("", "", string.punctuation))
        word_counter.update(cleaned.split())
    most_common = word_counter.most_common(top_n)
    top = [{"word": word, "count": count} for word, count in most_common]
    return {"top": top}
