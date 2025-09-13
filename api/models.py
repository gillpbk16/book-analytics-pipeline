"""Pydantic models for API responses."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

# Book models
class BookOut(BaseModel):
    id: str
    title: str
    url: str
    price: Optional[float]
    availability: str   

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
        json_schema_extra={
            "example": {
                "id": "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
                "title": "A Light in the Attic",
                "url": "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
                "price": 51.77,
                "availability": "In stock (22 available)"
            }
        }
    )

class BooksResponse(BaseModel):
    total: int
    items: List[BookOut]

# Analytics Models
class AvailabilityBucket(BaseModel):
    label: str
    count: int

class AvailabilityResponse(BaseModel):
    total: int
    buckets: List[AvailabilityBucket]

class PriceStats(BaseModel):
    count: int
    min: Optional[float]
    max: Optional[float]
    average: Optional[float]

class PriceBucket(BaseModel):
    lower: float
    upper: float
    count: int

class PriceBucketsResponse(BaseModel):
    buckets: List[PriceBucket]

class WordCount(BaseModel):
    word: str
    count: int

class WordsResponse(BaseModel):
    top: List[WordCount]


    