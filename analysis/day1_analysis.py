import json 
import matplotlib.pyplot as plt
from pathlib import Path    
from collections import Counter




datapath = Path("../data/sample_run.json")
books = json.loads(datapath.read_text(encoding="utf-8"))
print(f'Loaded {len(books)} books from {datapath}')


print("First item keys:" , books[0].keys())

def parse_price(price_str):
    """Convert price string like '£51.77' to float 51.77"""
    return float(price_str.replace("£", "").strip())

prices = [parse_price(book["price"]) for book in books if "price" in book]
print(f"Parsed {len(prices)} prices.")

avail = Counter(book.get("availability", "Unknown") for book in books)
print("\nAvailability counts:")
for status, count in avail.items():
    print(f" {status}: {count}")

if prices:
    print("\nPrice stats:")
    print(f"  Min price: £{min(prices):.2f}")
    print(f"  Max price: £{max(prices):.2f}")
    print(f"  Average price: £{sum(prices)/len(prices):.2f}")

words = Counter()
for book in books:
    words.update(book["title"].lower().split())
print("\nMost common words in titles:")
for word, count in words.most_common(10):
    print(f" '{word}': {count}")

plt.hist(prices, bins=20, color='skyblue', edgecolor='black')
plt.title("Histogram of Book Prices")
plt.xlabel("Price (£)") 
plt.ylabel("Number of Books")
plt.show()

top_expensive = sorted(books, key=lambda b: float(b["price"].strip("£")), reverse=True)[:10]
print("\nTop 10 Most Expensive Books:")
for book in top_expensive:
    print(f"{book['title']} - {book['price']}")

