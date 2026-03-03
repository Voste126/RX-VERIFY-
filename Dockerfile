# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE PREVENTS PYTHON FROM WRITING .pyc FILES TO DISC
# PYTHONUNBUFFERED PREVENTS PYTHON FROM BUFFERING STDOUT AND STDERR
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
# gcc and libpq-dev are needed for psycopg2 (PostgreSQL adapter)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy backend source code into /app
COPY backend /app

# Create a non-root user and change ownership
RUN groupadd -r django && useradd -r -g django django \
    && chown -R django:django /app
USER django

# Expose port
EXPOSE 8000

# Run migrations, collect static files, then start Gunicorn.
# migrate runs on every deploy so a fresh Render Postgres instance gets its
# tables created automatically. collectstatic is safe to run again each time.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:${PORT:-8000} core.wsgi:application"]
