"""
Database layer for the book analytics pipeline.

Provides unified interface for loading book data from either MongoDB or local JSON file,
with support for filtering, sorting, and analytics queries.
"""
import os
import json
import math
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache
import pymongo
from dotenv import load_dotenv
from pathlib import Path
from api.utils import parse_price 

# Load environment variables
load_dotenv()

# Configuration constants
USE_MONGO = os.getenv("USE_MONGO", "true").lower() == "true"
DATA_PATH = (Path(__file__).resolve().parents[1] / "data" / "sample_run.json")
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "books_db")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION", "books")

# Custom exceptions
class DataLoadError(RuntimeError):
    """Raised when there's an error loading or processing book data."""
    pass

# Database connection functions
@lru_cache(maxsize=1)
def get_collection():
    """
    Get MongoDB collection with connection caching.
    
    Returns:
        pymongo.Collection: The books collection
        
    Raises:
        DataLoadError: If connection to MongoDB fails
    """
    try: 
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.admin.command("ping")
        db = client[DB_NAME]
        return db[COLLECTION_NAME]
    except Exception as e:
        raise DataLoadError(f"Could not connect to MongoDB: {e}") from e
        

# Data loading functions
def _load_from_file() -> List[Dict[str, Any]]:
    """
    Load book data from local JSON file.
    
    Returns:
        List[Dict]: Normalized book data
        
    Raises:
        DataLoadError: If file cannot be read or parsed
    """
    try:
        text = DATA_PATH.read_text(encoding="utf-8")
        data = json.loads(text)
        if not isinstance(data, list):
            raise DataLoadError("Books data is not in a list")
        return [_normalise_item(raw) for raw in data]
    except FileNotFoundError as e:
        raise DataLoadError(f"Data File not found: {DATA_PATH}") from e
    except json.JSONDecodeError as e:
        raise DataLoadError(f"Invalid JSON in {DATA_PATH}: {e}") from e
    
def _normalise_item(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalise raw book data into consistent format.
    
    Args:
        raw: Raw book data from database or file
        
    Returns:
        Dict: Normalised book data with consistent fields
    """
    _id_fallback = str(raw.get("_id") or "").strip()
    price_num = raw.get("price_num")
    return {
        "id": (raw.get("id") or raw.get("url") or _id_fallback).strip(),
        "title": (raw.get("title") or "").strip(),
        "url": (raw.get("url") or "").strip(),
        "price": price_num if isinstance(price_num, (int, float)) else parse_price(raw.get("price")),
        "availability": (raw.get("availability") or "").strip()
    }

@lru_cache(maxsize=1)
def load_books() -> List[Dict[str, Any]]:
    """Load all books from configured data source (MongoDB or file)."""
    if USE_MONGO:
        try: 
            coll = get_collection()
            docs = list(
                coll.find(
                    {}, 
                    {"_id": 1,
                    "url" : 1,
                    "title": 1,
                    "price": 1,
                    "price_num": 1,
                    "availability" : 1},
                )
            )
            return [_normalise_item(doc) for doc in docs]
        except DataLoadError:
            raise
        except Exception as e:
            raise DataLoadError(f"Failed to load books from MONGODB: {e}")
    else: 
        return _load_from_file()
    
# MongoDB query building functions 
def build_mongo_query(
        q: Optional[str],
        availability: Optional[str],
        price_min: Optional[float],
        price_max: Optional[float],
) -> dict:
    """
    Build MongoDB query from search parameters.
    
    Args:
        q: Text search query for title
        availability: Availability status filter
        price_min: Minimum price filter
        price_max: Maximum price filter
        
    Returns:
        dict: MongoDB query document
    """
    query = {}

    # Text search in title
    if q: 
        query["title"] = {"$regex": q, "$options": "i"}

    # Exact availability match 
    if availability: 
        query["availability"] = {
            "$regex": f"^{availability.strip()}$",
            "$options": "i",
            }

    # Price range filter    
    price_cond: Dict[str, float] = {}
    if price_min is not None:
        price_cond["$gte"] = price_min
    if price_max is not None:
        price_cond["$lte"] = price_max
    if price_cond:
        query["price_num"] = price_cond
    
    return query


def _mongo_sort(sort: Optional[str]) -> list:
    """
    Convert sort parameter to MongoDB sort specification.
    
    Args:
        sort: Sort parameter (price_asc, price_desc, title_asc, title_desc)
        
    Returns:
        list: MongoDB sort specification
    """
    if not sort: 
        return []
    if sort == "price_asc":
        return [("price_num", pymongo.ASCENDING)]
    if sort == "price_desc":
        return [("price_num", pymongo.DESCENDING)]
    if sort == "title_asc":
        return [("title", pymongo.ASCENDING)]
    if sort == "title_desc":
        return [("title", pymongo.DESCENDING)]
    return []

# MongoDB data retrieval functions
def list_books_mongo(
        q: Optional[str], 
        price_min: Optional[float], 
        price_max: Optional[float],
        availability: Optional[str], 
        limit: int, 
        offset: int, 
        sort: Optional[str]
 ) -> Tuple[int, list]:
    """
    List books from MongoDB with filtering, sorting, and pagination.
    
    Args:
        q: Search query for title
        price_min: Minimum price filter
        price_max: Maximum price filter
        availability: Availability status filter
        limit: Maximum number of results
        offset: Number of results to skip
        sort: Sort parameter
        
    Returns:
        tuple: (total_count, book_list)
    """
    
    coll = get_collection()
    query = build_mongo_query(q, availability, price_min, price_max)
    total = coll.count_documents(query)
    sort_spec = _mongo_sort(sort)
    cursor = coll.find(
        query, 
        {
            "_id": 1,
            "id": 1,
            "title": 1,
            "url": 1,
            "availability": 1,
            "price": 1,
            "price_num": 1,
        },
    )
    if sort_spec:
        cursor = cursor.sort(sort_spec)

    cursor = cursor.skip(offset).limit(limit)         
    

    docs = list(cursor)
    items = [_normalise_item(doc) for doc in docs]
    return total, items 

# Analytics functions
def price_stats_mongo() -> Dict[str, Any]:
    """
    Calculate price statistics from MongoDB.
    
    Returns:
        Dict: Price statistics (count, min, max, average)
    """
    coll = get_collection()
    
    pipeline = [
        {"$match": {"price_num": {"$ne": None }}}, 
        {
            "$group": {
                "_id": None,
                "count": {"$sum": 1},
                "min": {"$min": "$price_num"},
                "max": {"$max": "$price_num"},
                "average": {"$avg": "$price_num"},
            }
        },
    ]

    docs = list(coll.aggregate(pipeline))
    if not docs: 
        return {"count": 0, "min": None, "max": None, "average": None}
    
    g = docs[0]

    return {
        "count": int(g.get("count", 0)),
        "min": float(g["min"]) if g.get("min") is not None else None,
        "max": float(g["max"]) if g.get("max") is not None else None,
        "average": float(g["average"]) if g.get("average") is not None else None,
    }

def availability_mongo() -> Dict[str, Any]:
    """
    Get availability distribution from MongoDB.
    
    Returns:
        Dict: Availability buckets with counts and total
    """
    coll = get_collection()
    pipeline = [
        {
            "$group": {
                "_id": {
                    "$toLower": {
                        "$ifNull": ["$availability", "unknown"]
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},  
    ]

    rows = list(coll.aggregate(pipeline))
    buckets = [{"label": r["_id"], "count": int(r["count"])} for r in rows]
    total = sum(b["count"] for b in buckets)
    return {"total": total, "buckets": buckets}


def price_buckets_mongo(bucket_size: float) -> Dict[str, Any]: 
    """Get price distribution buckets."""
    coll = get_collection()

    # Get price range statistics
    stats_pipeline = [
        {"$match" : {"price_num": {"$ne" : None}}},
        {
            "$group" : {
                "_id" : None, 
                "min_price": {"$min" : "$price_num"} ,
                "max_price": {"$max": "$price_num"},
                "count" : {"$sum" : 1}
            }
        }
    ]

    stats_result = list(coll.aggregate(stats_pipeline))
    if not stats_result or stats_result[0]["count"]== 0: 
        return {"buckets": []}
    
    min_price = stats_result[0]["min_price"]
    max_price = stats_result[0]["max_price"]

    num_buckets = int((max_price - min_price) / bucket_size) + 1
    
    # Calculate bucket distribution
    bucket_pipeline = [
        {"$match": {"price_num": {"$ne": None}}},
        {
            "$addFields": {
                "bucket_index": {
                    "$floor": {
                        "$divide": [
                            {"$subtract": ["$price_num", min_price]},
                            bucket_size
                        ]
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$bucket_index",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    bucket_results = list(coll.aggregate(bucket_pipeline))
    bucket_counts = {int(result["_id"]): result["count"] for result in bucket_results}
    
    # Build final bucket structure
    buckets = []
    for i in range(num_buckets):
        lower = min_price + i * bucket_size
        upper = lower + bucket_size
        count = bucket_counts.get(i, 0)
        buckets.append({
            "lower": float(lower),
            "upper": float(upper), 
            "count": int(count)
        })
    
    return {"buckets": buckets}


    

