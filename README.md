# SNIP — URL Shortener

A full-stack URL shortener built as a DevOps learning project.

## Tech Stack

| Layer       | Technology              |
| ----------- | ----------------------- |
| Frontend    | HTML, CSS, JavaScript   |
| Backend API | Node.js + Express       |
| Database    | PostgreSQL 15           |
| Proxy       | Nginx                   |
| Containers  | Docker + Docker Compose |
| CI/CD       | GitHub Actions          |
| Cloud       | AWS EC2                 |

---

## Project Structure

```
snip-url/
├── backend/
│   ├── server.js          # Express API — all routes
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Backend container image
├── frontend/
│   ├── index.html         # Main page (served as static file)
│   └── static/
│       ├── style.css      # All styles
│       └── app.js         # Frontend logic (real API calls)
├── nginx/
│   └── nginx.conf         # Reverse proxy config
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD pipeline
├── docker-compose.yml     # Orchestrates all 3 services
├── .env.example           # Environment variable template
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method   | Endpoint          | Description                  |
| -------- | ----------------- | ---------------------------- |
| `POST`   | `/api/shorten`    | Create a short URL           |
| `GET`    | `/api/urls`       | List all URLs (history)      |
| `DELETE` | `/api/urls/:code` | Delete a short URL           |
| `GET`    | `/:short_code`    | Redirect to the original URL |
| `GET`    | `/health`         | Backend health check         |

---

## Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- [Git](https://git-scm.com)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/snip-url.git
cd snip-url
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

Edit `.env` and set a strong `DB_PASSWORD`.

**3. Start all services**

```bash
docker compose up --build
```

**4. Open in your browser**

```
http://localhost
```

To stop:

```bash
docker compose down
```

To stop and delete the database volume:

```bash
docker compose down -v
```

---

## Deploying to AWS EC2

### 1. Launch an EC2 instance

- AMI: **Ubuntu Server 22.04 LTS**
- Instance type: **t2.micro** (free tier)
- Security group — open inbound ports:
  - **22** (SSH)
  - **80** (HTTP)

### 2. Install Docker on EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu

# Log out and back in for the group change to take effect
exit
```

### 3. Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** and add:

| Secret name   | Value                        |
| ------------- | ---------------------------- |
| `EC2_HOST`    | Your EC2 public IP address   |
| `EC2_USER`    | `ubuntu`                     |
| `EC2_SSH_KEY` | Contents of your `.pem` file |
| `DB_NAME`     | `urlshortener`               |
| `DB_USER`     | `postgres`                   |
| `DB_PASSWORD` | A strong password            |

### 4. Push to main to trigger deployment

```bash
git add .
git commit -m "initial commit"
git push origin main
```

Watch it run under the **Actions** tab in GitHub.  
Your app will be live at `http://YOUR_EC2_IP`.

---

## Environment Variables

| Variable      | Description                               | Example               |
| ------------- | ----------------------------------------- | --------------------- |
| `DB_HOST`     | PostgreSQL hostname (Docker service name) | `db`                  |
| `DB_PORT`     | PostgreSQL port                           | `5432`                |
| `DB_NAME`     | Database name                             | `urlshortener`        |
| `DB_USER`     | Database user                             | `postgres`            |
| `DB_PASSWORD` | Database password                         | `supersecretpassword` |
| `PORT`        | Port the Node.js server listens on        | `5000`                |
| `BASE_URL`    | Public base URL for short links           | `http://YOUR_EC2_IP`  |
