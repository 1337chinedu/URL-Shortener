# URL-Shortener

A Dockerized URL shortening service built with Flask, PostgreSQL, Nginx, and GitHub Actions, featuring automated CI/CD and scalable deployment.

## URL Shortener (Simplified)

This repo is a learning project for a basic URL shortener.

Structure:

- backend: Flask API
- frontend: static HTML/CSS served via Nginx
- nginx: Nginx configuration
- docker-compose.yml: Compose stack (Postgres, backend, frontend)

Quick start (fill `.env` from `.env.example`):

```bash
cp .env.example .env
# Edit .env and set passwords
docker compose up --build
```

The frontend will be available at http://localhost:8080

Notes:

- The backend exposes `POST /api/shorten` and redirects `GET /<short_id>`.
- This is a minimal scaffold for learning; extend with validation, authentication, and tests.
