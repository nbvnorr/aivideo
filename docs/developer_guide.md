# Autonomous AI Video Creation Platform - Developer Guide

This guide provides instructions for setting up the development environment, understanding the architecture, and contributing to the project.

## 1. Introduction

This platform is built with a modern technology stack to ensure scalability, performance, and maintainability. This guide will help you get started with developing new features and maintaining the existing codebase.

### Technology Stack:
-   **Frontend:** React, Redux, Tailwind CSS
-   **Backend:** NestJS, TypeORM, Mongoose
-   **Databases:** PostgreSQL, MongoDB, Redis
-   **AI Services:** OpenAI, ElevenLabs, Stability AI
-   **Video Processing:** FFmpeg
-   **Deployment:** Docker, Nginx, GitHub Actions

## 2. Development Setup

### 2.1. Prerequisites

-   Node.js (v18 or later)
-   Docker and Docker Compose
-   Git

### 2.2. Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/video-creation-platform.git
    cd video-creation-platform
    ```

2.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file with your local configuration.

3.  **Install dependencies:**
    ```bash
    # Install backend dependencies
    cd video-creation-backend
    npm install

    # Install frontend dependencies
    cd ../video-creation-frontend
    npm install
    ```

4.  **Start the development environment:**
    ```bash
    docker-compose up -d
    ```

5.  **Run the applications:**
    ```bash
    # Start the backend server
    cd video-creation-backend
    npm run start:dev

    # Start the frontend server
    cd ../video-creation-frontend
    npm run dev
    ```

## 3. Architecture

### 3.1. High-Level Overview

The platform is composed of three main components:

-   **Frontend:** A React single-page application that provides the user interface.
-   **Backend:** A NestJS application that handles business logic, API requests, and AI integration.
-   **Databases:** PostgreSQL for structured data, MongoDB for unstructured data, and Redis for caching and job queues.

### 3.2. Backend Architecture

The backend is built with a modular architecture, with each feature encapsulated in its own module.

-   **`auth`:** Handles user authentication and authorization.
-   **`users`:** Manages user profiles and settings.
-   **`videos`:** Handles video project management.
-   **`series`:** Manages content series.
-   **`ai`:** Integrates with AI services for content generation.
-   **`media`:** Handles video processing and media storage.
-   **`social`:** Integrates with social media platforms.
-   **`jobs`:** Manages background job processing.

### 3.3. Frontend Architecture

The frontend is built with React and Redux for state management.

-   **`components`:** Reusable UI components.
-   **`pages`:** Application pages (e.g., Dashboard, Settings).
-   **`store`:** Redux store, slices, and actions.
-   **`services`:** API service for communicating with the backend.

## 4. Contributing

### 4.1. Branching Strategy

-   **`main`:** Production-ready code.
-   **`develop`:** Development branch for new features.
-   **`feature/...`:** Feature branches for new development.
-   **`bugfix/...`:** Branches for bug fixes.

### 4.2. Code Style

We use Prettier and ESLint to enforce a consistent code style. Please run the linter before submitting a pull request.

```bash
# Lint backend code
npm run lint --workspace=video-creation-backend

# Lint frontend code
npm run lint --workspace=video-creation-frontend
```

### 4.3. Testing

We use Jest for unit and integration testing, and Supertest for end-to-end testing.

```bash
# Run backend tests
npm test --workspace=video-creation-backend

# Run frontend tests
npm test --workspace=video-creation-frontend
```

### 4.4. Submitting a Pull Request

1.  **Create a new feature branch** from `develop`.
2.  **Make your changes** and commit them with a descriptive message.
3.  **Push your branch** to the repository.
4.  **Create a pull request** to merge into `develop`.

## 5. Deployment

We use Docker and GitHub Actions for CI/CD.

-   **Staging:** Deployed automatically on pushes to `develop`.
-   **Production:** Deployed automatically on pushes to `main`.

The deployment process includes:

1.  **Running tests and linting.**
2.  **Building Docker images.**
3.  **Pushing images to the container registry.**
4.  **Deploying to the target environment.**

For manual deployment, you can use the `deploy.sh` script.

```bash
./deploy.sh deploy production
```

## 6. API Documentation

API documentation is automatically generated using Swagger and is available at `/api` on the backend server.

Thank you for contributing to the Autonomous AI Video Creation Platform!

