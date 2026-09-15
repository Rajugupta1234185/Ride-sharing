# 🚗 Ride-Sharing Platform

A production-oriented ride-sharing platform built with **Flutter** and a **NestJS microservices architecture**.

The system is designed to support rider and driver workflows, authentication, ride management, location services, real-time communication, matching, and scalable backend services.

---

## 🏗️ Architecture

```text
                         Flutter App
                             │
                             │ HTTP / WebSocket
                             ▼
                       API Gateway
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    User Service       Location Service    Trip Service
                                                │
                                                ▼
                                        Matching Service

          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    Kafka / Redis
                             │
                             ▼
                         PostgreSQL
```

---

## 🛠️ Tech Stack

### Frontend

* Flutter
* Dart
* Dio
* GoRouter
* MVVM architecture
* SQLite
* Secure Storage
* Mapbox

### Backend

* NestJS
* TypeScript
* Microservices Architecture
* PostgreSQL
* Prisma
* Redis
* Kafka
* WebSockets
* JWT Authentication
* Docker

---

# 📁 Project Structure

```text
Ride-sharing/
│
├── App/
│   └── ride_app/                 # Flutter application
│
├── api-gateway/                  # API Gateway
│
├── user-service/                 # User & authentication service
│
├── location-service/             # Location tracking service
│
├── trip-service/                 # Trip/Ride management service
│
├── matching-service/             # Driver-rider matching service
│
├── kafka/                        # Kafka configuration
│
├── .gitignore
└── README.md
```

---

# ⚙️ Prerequisites

Install the following before running the project:

* Node.js
* npm
* Flutter SDK
* Dart SDK
* PostgreSQL
* Redis
* Apache Kafka
* Android Studio / VS Code
* Git

Verify your installations:

```bash
node --version
npm --version
flutter --version
dart --version
```

---

# 🔐 Environment Variables

Each backend microservice has its own `.env` file.

**Do not commit real `.env` files to Git.**

Create the following files:

```text
api-gateway/.env
user-service/.env
location-service/.env
trip-service/.env
matching-service/.env
```

Example:

```text
api-gateway/
├── .env
├── .env.example
└── ...

user-service/
├── .env
├── .env.example
└── ...
```

The actual values depend on your local PostgreSQL, Redis, Kafka, JWT, and Mapbox configuration.

---

# 🚪 API Gateway

Navigate to the API Gateway:

```bash
cd api-gateway
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add the required environment variables.

Start the development server:

```bash
npm run start:dev
```

---

# 👤 User Service

Open a new terminal.

```bash
cd user-service
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add the required environment variables.

Start the service:

```bash
npm run start:dev
```

---

# 📍 Location Service

Open a new terminal.

```bash
cd location-service
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add the required environment variables, including the Mapbox configuration if required by the service.

Start the service:

```bash
npm run start:dev
```

---

# 🚕 Trip Service

Open a new terminal.

```bash
cd trip-service
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add the required environment variables.

Start the service:

```bash
npm run start:dev
```

---

# 🎯 Matching Service

Open a new terminal.

```bash
cd matching-service
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add the required environment variables.

Start the service:

```bash
npm run start:dev
```

---

# 📱 Flutter Application

Navigate to the Flutter application:

```bash
cd App/ride_app
```

Install Flutter dependencies:

```bash
flutter pub get
```

Check connected devices:

```bash
flutter devices
```

Run the application:

```bash
flutter run
```

---

# 🗺️ Mapbox Configuration

The Flutter application requires a Mapbox access token.

For local development, provide the token through a Dart define:

```bash
flutter run --dart-define=MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

For a release build:

```bash
flutter build apk --release --dart-define=MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

For production, use a restricted Mapbox public token and provide it through your CI/CD environment rather than committing it to the repository.

---

# 🗄️ Database

The backend services use PostgreSQL.

Make sure PostgreSQL is running before starting services that depend on it.

Each service can have its own database or database schema depending on the deployment architecture.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

---

# 🔴 Redis

Redis is used for caching, temporary data, queues, and real-time application workflows.

Make sure Redis is running before starting services that depend on it.

Example:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

# 📨 Kafka

Kafka is used for communication between microservices and event-driven workflows.

Make sure Kafka and its required dependencies are running before starting the services that use Kafka.

Example:

```env
KAFKA_BROKERS=localhost:9092
```

The exact Kafka environment variables may differ between services.

---

# ▶️ Running the Complete System

Start the infrastructure first:

```text
PostgreSQL
Redis
Kafka
```

Then start the backend services.

### Terminal 1 — API Gateway

```bash
cd api-gateway
npm run start:dev
```

### Terminal 2 — User Service

```bash
cd user-service
npm run start:dev
```

### Terminal 3 — Location Service

```bash
cd location-service
npm run start:dev
```

### Terminal 4 — Trip Service

```bash
cd trip-service
npm run start:dev
```

### Terminal 5 — Matching Service

```bash
cd matching-service
npm run start:dev
```

Finally, start Flutter:

### Terminal 6 — Flutter

```bash
cd App/ride_app
flutter pub get
flutter run --dart-define=MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

---

# 🔄 Development Workflow

A typical development workflow is:

```text
Flutter App
     │
     ▼
API Gateway
     │
     ├──────────► User Service
     │
     ├──────────► Trip Service
     │
     ├──────────► Location Service
     │
     └──────────► Matching Service
                       │
                       ▼
                 Kafka / Redis
                       │
                       ▼
                  PostgreSQL
```

---

# 🔒 Security

Never commit the following to Git:

```text
.env
.env.*
database passwords
JWT secrets
AWS credentials
private API keys
service credentials
```

Use `.env.example` files to document required variables without exposing their values.

For production deployments, use environment variables or a dedicated secret-management system.

---

# 🚧 Project Status

This project is currently under active development.

Future improvements may include:

* Driver onboarding
* Ride request workflow
* Advanced driver-rider matching
* Real-time driver location updates
* Ride tracking
* Payment integration
* Push notifications
* Rating and review system
* Production CI/CD
* Kubernetes deployment
* Monitoring and observability

---

# 👨‍💻 Author

**Raju Gupta**

Backend-focused Full-Stack Developer

Built with Flutter, NestJS, PostgreSQL, Redis, Kafka, Docker, and AWS.
