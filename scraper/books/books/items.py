import scrapy

class BooksItem(scrapy.Item):
    _id = scrapy.Field()
    url = scrapy.Field()
    price = scrapy.Field()
    title = scrapy.Field()
    availability = scrapy.Field()
    price_num = scrapy.Field()