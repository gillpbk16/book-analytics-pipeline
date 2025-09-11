# Book Analytics Pipeline

Data pipeline that scrapes book information, stores it in MongoDB, and provides analytics. Built to practice end-to-end data engineering and full-stack development.

## Tech Stack

- Python 3.10+
- Scrapy
- MongoDB
- PyMongo
- FastAPI
- React with TypeScript

## Setup

Clone and install dependencies: 

git clone https://github.com/gillpbk16/book-analytics-pipeline.git
cd book-analytics-pipeline

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..

Make sure MongoDB is running locally at mongodb://localhost:27017.

## Usage

cd scraper/books

scrapy crawl book -O ../../data/books.json

Scrapes ~1000 books from Books to Scrape and stores in MongoDB with JSON backup.

## Start the API and frontend:

bashuvicorn api.main:app --reload          # Backend: http://127.0.0.1:8000  
cd frontend && npm run dev                 # Frontend: http://localhost:5173

## Current Features

- Web scraping with error handling
- MongoDB storage with indexing and aggregation pipelines
- JSON exports for analysis
- REST API with filtering, sorting, pagination
- Interactive dashboard with real-time search
- CSV export of filtered results
- URL state management for shareable links
- Comprehensive test suite

## API Overview

The backend exposes a FastAPI service at http://127.0.0.1:8000.

Endpoints
- GET /health – quick status check.
- GET /books – list books with filters (q, price_min, price_max, availability, limit, offset, sort).
- GET /analytics/availability – counts books by availability.
- GET /analytics/price-stats – min / max / average book prices.
- GET /analytics/price-buckets – histogram of prices (configurable bucket size).
- GET /analytics/title-words – most frequent words in book titles.

## Testing

pytest                              # All tests
pytest tests/test_api.py            # Unit tests with mocked data
pytest tests/test_api_mongo_min.py  # MongoDB integration tests

## Next Steps

- Docker containerisation
- CI/CD pipeline
- Production deployment
- Additional data sources

