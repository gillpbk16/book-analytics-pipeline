"""
Database setup script: adds price_num field and creates indexes.
Run once after initial data import to optimize queries.
"""

import os
import pymongo
import sys

#Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__))) 
from api.utils import parse_price

#Database configuration
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "books_db")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION", "books")

def main():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    coll = db[COLLECTION_NAME]

    print("Updating price_num field in all documents")

    updated = 0
    for doc in coll.find( {}, {"_id": 1, "price": 1}):
        price_num = parse_price(doc.get("price"))
        coll.update_one({"_id": doc["_id"]}, {"$set": {"price_num": price_num}})
        updated += 1

    print(f"Updated {updated} documents.")

    coll.create_index("price_num")
    coll.create_index("url", unique=True)
    coll.create_index("title")
    coll.create_index("availability")

    print("Indexes created")

if __name__ == "__main__":
    main()