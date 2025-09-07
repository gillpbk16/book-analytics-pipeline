# Book Analytics Pipeline

Data pipeline that scrapes book information, stores it in MongoDB, and provides analytics. Built to practice end-to-end data engineering.

## Tech Stack

- Python 3.10+
- Scrapy
- MongoDB
- PyMongo

## Setup

Clone and install dependencies: 

git clone https://github.com/gillpbk16/book-analytics-pipeline.git
cd book-analytics-pipeline

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Make sure MongoDB is running locally at mongodb://localhost:27017.

## Usage

cd scraper/books

scrapy crawl book -O ../../data/books.json


Scrapes ~1000 books from Books to Scrape and stores in MongoDB with JSON backup.

## Current Features

- Web scraping with error handling
- MongoDB storage with indexing
- JSON exports for analysis

## Next Steps

- Pandas analysis (price trends, ratings distribution)
- REST API
- Basic dashboard
