FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Seed data on container start if database does not exist, then start gunicorn
ENV PORT=5000
EXPOSE 5000

CMD ["sh", "-c", "python seed_data.py && gunicorn --bind 0.0.0.0:${PORT} run:app"]

