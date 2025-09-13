FROM python:3.11-slim


WORKDIR /app/scraper
COPY scraper/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# 3) Copy the whole scraper project (so scrapy.cfg and books/ are present)
COPY scraper/ /app/scraper
WORKDIR /app/scraper/books