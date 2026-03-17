FROM python:3.11-slim

# System deps: Tesseract OCR (Arabic + English) + PostgreSQL client + image libs
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ara \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Create directories
RUN mkdir -p media staticfiles

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
