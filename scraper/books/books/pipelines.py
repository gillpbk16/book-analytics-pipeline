import hashlib
import pymongo
import re
from itemadapter import ItemAdapter

class MongoPipeline:
    COLLECTION_NAME = "books"

    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.client = None
        self.db = None

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri=crawler.settings.get("MONGO_URI"),
            mongo_db=crawler.settings.get("MONGO_DATABASE"),
        )

    def open_spider(self, spider):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]
        self.db[self.COLLECTION_NAME].create_index("url")

    def close_spider(self, spider):
        if self.client:
            self.client.close()


    def process_item(self, item, spider):
        adapter = ItemAdapter(item)


        raw = adapter.get("price", "")
        price_num = None
        if isinstance(raw, (int, float)):
            price_num = float(raw)
        elif isinstance(raw, str):
            s = raw.replace(",", "")
            m = re.search(r"\d+(\.\d+)?", s)
            if m:
                try:
                    price_num = float(m.group(0))
                except ValueError:
                    price_num = None
        adapter["price_num"] = price_num

        url = adapter["url"]
        _id = hashlib.sha256(url.encode("utf-8")).hexdigest()
        adapter["_id"] = _id

        self.db[self.COLLECTION_NAME].update_one(
            {"_id": _id},
            {"$set": adapter.asdict()},
            upsert=True,
        )
        return item
    
    @staticmethod
    def compute_item_id(url: str) -> str:
        return hashlib.sha256(url.encode("utf-8")).hexdigest()    
