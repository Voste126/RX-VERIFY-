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

# Migrations and collectstatic are handled by render.yaml preDeployCommand
# so Gunicorn starts immediately and Render can detect the open port.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 core.wsgi:application"]
