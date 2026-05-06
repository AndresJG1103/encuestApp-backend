# LearnPulse API (Backend)

LearnPulse API is a multi-tenant survey and training platform built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/).

## Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Quick Start (Docker Compose)

The easiest way to run the project locally is using Docker Compose. This will spin up the database (PostgreSQL), Redis, MailHog (SMTP testing), and the NestJS backend all at once.

1. **Environment Variables**
   Make sure you have a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. **Start the Services**
   Run the following command to build the images and start the containers in the background:
   ```bash
   docker compose up -d --build
   ```
   *(Note: The Prisma client is automatically generated during the Docker build process)*

3. **Database Setup & Seeding**
   Once the containers are running, you need to migrate the database and populate it with initial seed data (if this is your first time):
   ```bash
   # Run migrations
   docker exec learnpulse_backend pnpm run db:migrate

   # Seed the database
   docker exec learnpulse_backend pnpm run db:seed
   ```

## Services & Ports

When running via `docker compose`, the following services are available:

- **LearnPulse API:** http://localhost:3000/api/v1
- **Swagger Documentation:** http://localhost:3000/api/v1/docs
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`
- **MailHog (SMTP Web UI):** http://localhost:8025

## Common Prisma Commands

If you want to view the database visually using Prisma Studio on your local machine:
```bash
# Assuming you have Node/pnpm installed locally
npx prisma studio
```

To create a new migration after making changes to `prisma/schema.prisma`:
```bash
# Run this inside the backend container
docker exec learnpulse_backend pnpm run db:migrate
```

## Running without Docker (Local Node.js)

If you prefer to run only the dependencies in Docker and the NestJS app directly on your host machine:

1. Spin up only the dependencies:
   ```bash
   docker compose up -d postgres redis mailhog
   ```
2. Install local dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run start:dev
   ```
