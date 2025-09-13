#api/Dockerfile
FROM python:3.11-slim

# OS deps (adjust if you need others)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

#Install Python deps from requirements.txt in project root
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

#Copy only the API source code
COPY api/ /app/api

EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]

