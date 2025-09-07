import unittest
from urllib.parse import urljoin
from itemadapter import ItemAdapter
from scrapy.http import HtmlResponse, Request
from books.spiders.book import BookSpider
from books.items import BooksItem


class BookSpiderTest(unittest.TestCase):

    def setUp(self):
        self.spider = BookSpider()
        self.base_url = "https://books.toscrape.com/"
        self.example_html = """
           <html>

<body>
    <div class="container-fluid page">
        <div class="page_inner">

            <div class="row">

                <div class="col-sm-8 col-md-9">

                    <div class="page-header action">
                        <h1>All products</h1>
                    </div>

                    <div id="messages">

                    </div>

                    <div id="promotions">

                    </div>

                    <section>
                        <div class="alert alert-warning" role="alert"><strong>Warning!</strong>
                            This is a demo website
                            for web scraping purposes. Prices and ratings here were randomly
                            assigned and have no real
                            meaning.</div>

                        <div>
                            <ol class="row">

                                <li class="col-xs-6 col-sm-4 col-md-3 col-lg-3">

                                    <article class="product_pod">

                                        <div class="image_container">

                                            <a href="catalogue/a-light-in-the-attic_1000/index.html"><img
                                                    src="media/cache/2c/da/2cdad67c44b002e7ead0cc35693c0e8b.jpg"
                                                    alt="A Light in the Attic" class="thumbnail"></a>

                                        </div>

                                        <p class="star-rating Three">
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                        </p>

                                        <h3><a href="catalogue/a-light-in-the-attic_1000/index.html"
                                                title="A Light in the Attic">A Light in the ...</a></h3>

                                        <div class="product_price">

                                            <p class="price_color">£51.77</p>

                                            <p class="instock availability">
                                                <i class="icon-ok"></i>

                                                In stock

                                            </p>

                                            <form>
                                                <button type="submit" class="btn btn-primary btn-block"
                                                    data-loading-text="Adding...">Add to basket</button>
                                            </form>

                                        </div>

                                    </article>

                                </li>
                                <li class="col-xs-6 col-sm-4 col-md-3 col-lg-3">

                                    <article class="product_pod">

                                        <div class="image_container">

                                            <a href="catalogue/tipping-the-velvet_999/index.html"><img
                                                    src="media/cache/26/0c/260c6ae16bce31c8f8c95daddd9f4a1c.jpg"
                                                    alt="Tipping the Velvet" class="thumbnail"></a>

                                        </div>

                                        <p class="star-rating One">
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                            <i class="icon-star"></i>
                                        </p>

                                        <h3>
                                            <a href="catalogue/tipping-the-velvet_999/index.html"
                                                title="Tipping the Velvet">
                                                Tipping the Velvet
                                            </a>
                                        </h3>

                                        <div class="product_price">

                                            <p class="price_color">£53.74</p>

                                            <p class="instock availability">
                                                <i class="icon-ok"></i>

                                                In stock

                                            </p>

                                            <form>
                                                <button type="submit" class="btn btn-primary btn-block"
                                                    data-loading-text="Adding...">
                                                    Add to basket
                                                </button>
                                            </form>

                                        </div>

                                    </article>

                                </li>
                            </ol>

                            <div>
                                <ul class="pager">

                                    <li class="current">

                                        Page 1 of 50

                                    </li>

                                    <li class="next">
                                        <a href="catalogue/page-2.html">next</a>
                                    </li>

                                </ul>
                            </div>

                        </div>
                    </section>

                </div>

            </div><!-- /row -->
        </div><!-- /page_inner -->
    </div>
</body>

</html>
        """
        
        self.response = HtmlResponse(
            url=self.base_url,
            body=self.example_html.encode("utf-8"),
            encoding="utf-8",
            request=Request(self.base_url),
        )

    def split_results(self, results):
        items, requests = [],[]

        for r in results: 
            if isinstance(r, Request):
                requests.append(r)
            else:
                items.append(ItemAdapter(r).asdict())
        return items, requests


    def test_parse_scrapes_all_items(self):
        results = list(self.spider.parse(self.response))
        items, requests = self.split_results(results)

        # There should be two book items and one pagination request
        book_items = [item for item in results if isinstance(item, BooksItem)]
        pagination_requests = [
            item for item in results if isinstance(item, Request)
        ]

        self.assertEqual(len(items), 2) 
        self.assertEqual(len(requests), 1)

    def test_parse_scrapes_correct_book_information(self):
       results = list(self.spider.parse(self.response))
       items , _ = self.split_results(results)
       
       a_litaa = next(i for i in items if i.get("title") == "A Light in the Attic")
       self.assertEqual(a_litaa.get("title"), "A Light in the Attic")
       self.assertEqual(a_litaa.get("price"), "£51.77")
       
       self.assertEqual(a_litaa.get("availability", "").strip(), "In stock")
       self.assertEqual(
            a_litaa.get("url"),
            urljoin(self.base_url, "catalogue/a-light-in-the-attic_1000/index.html"),
        )

    def test_parse_creates_pagination_request(self):
        results = list(self.spider.parse(self.response))
        _, requests = self.split_results(results)

        self.assertEqual(len(requests), 1)
        req = requests[0]

        self.assertEqual(req.url, urljoin(self.base_url, "catalogue/page-2.html"))

        self.assertTrue(callable(req.callback))
        self.assertEqual(getattr(req.callback, "__name__", None), "parse")

if __name__ == "__main__":
    unittest.main()

