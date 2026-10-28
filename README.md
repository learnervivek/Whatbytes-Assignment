# Healthcare Backend API

A simple, robust, and clean Healthcare Backend built using **Node.js**, **Express.js**, **PostgreSQL**, and **Prisma ORM**.

This project provides secure user authentication (JWT + bcryptjs), patient records management, doctor profiles management, and many-to-many patient-doctor assignment mappings with strict data ownership.

---

## Tech Stack

- **Runtime**: Node.js (v18+ with native ES Modules)
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma ORM (v6.x)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Password Hashing**: `bcryptjs`
- **Configuration**: `dotenv`
- **CORS**: `cors`

---

## Folder Structure

```text
WhatBytes-Assignment/
├── config/
│   └── db.js                 # Shared PrismaClient database connection
├── controllers/
│   ├── authController.js     # User registration and login logic
│   ├── patientController.js  # Patient CRUD with ownership enforcement
│   ├── doctorController.js   # Doctor CRUD with ownership enforcement
│   └── mappingController.js  # Patient-Doctor mapping logic & duplicate prevention
├── middleware/
│   └── authMiddleware.js     # JWT verification middleware protecting private routes
├── routes/
│   ├── authRoutes.js         # /api/auth routes
│   ├── patientRoutes.js      # /api/patients routes
│   ├── doctorRoutes.js       # /api/doctors routes
│   └── mappingRoutes.js      # /api/mappings routes
├── prisma/
│   ├── schema.prisma         # Prisma schema definitions and relations
│   └── migrations/           # Auto-generated SQL migration files
├── .env                      # Local environment configuration (ignored by git)
├── .env.example              # Template for environment configuration
├── .gitignore                # Excludes node_modules and .env
├── package.json              # Project dependencies and npm scripts
├── server.js                 # Server entry point and global error handling
└── README.md                 # Complete documentation and setup guide
```

---

## Prerequisites & Installation

### 1. Clone & Install Dependencies
```bash
# Clone the repository and navigate into the folder
cd WhatBytes-Assignment

# Install packages
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL database credentials:
```env
# Server Configuration (Use 5001 to prevent macOS AirPlay port 5000 conflicts)
PORT=5001

# PostgreSQL Connection URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare_db?schema=public"

# JWT Secret Key
JWT_SECRET="supersecret_jwt_key_change_in_production"
```

---

## PostgreSQL Setup & Migrations

### 1. Create the Database
Ensure your PostgreSQL server is running, then create the database:
```bash
# Using PostgreSQL CLI
createdb healthcare_db
```
*(Or in psql: `CREATE DATABASE healthcare_db;`)*

### 2. Apply Migrations
Run Prisma migration to create the tables in PostgreSQL:
```bash
npx prisma migrate dev --name init
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Verify Tables in PostgreSQL
```bash
psql -d healthcare_db -c '\dt'
```
You will see:
- `User`
- `Patient`
- `Doctor`
- `PatientDoctor`
- `_prisma_migrations`

---

## Running the Server

- **Production / Standard Mode**:
  ```bash
  npm start
  ```
- **Development Mode (Auto-reload on file change)**:
  ```bash
  npm run dev
  ```

Once running, verify health:
```bash
curl http://localhost:5001/health
# Response: {"status":"OK","message":"Healthcare Backend API is up and running"}
```

---

## Database Relationships Explained

- **User to Patients (1-to-Many)**: A user creates and owns multiple patients (`Patient.createdById -> User.id`).
- **User to Doctors (1-to-Many)**: A user creates and owns multiple doctors (`Doctor.createdById -> User.id`).
- **Patient to Doctor (Many-to-Many via `PatientDoctor`)**:
  - A patient can have multiple doctors assigned.
  - A doctor can be assigned to multiple patients.
  - `PatientDoctor` acts as the mapping join table containing `patientId`, `doctorId`, and `createdById`.
  - **Duplicate Prevention**: `@@unique([patientId, doctorId])` prevents the exact same doctor from being assigned to the same patient twice.

---

## JWT Authentication & Ownership Security

1. **Password Hashing**: Passwords are never stored in plain text. Stored passwords use `bcryptjs` with 10 salt rounds.
2. **Token Format**: Protected endpoints require an `Authorization` header formatted as:
   ```text
   Authorization: Bearer <YOUR_JWT_TOKEN>
   ```
3. **Data Isolation (Multi-tenant Ownership)**:
   - All `GET` list endpoints filter by `where: { createdById: req.user.id }`.
   - All `GET`, `PUT`, and `DELETE` by `:id` verify both the record ID and `createdById`.
   - Accessing another user's record returns `404 Not Found` (preventing ID enumeration).
   - `createdById` is taken strictly from the decoded JWT and cannot be spoofed in request bodies.

---

## Complete API Endpoints (16 Endpoints)

### 1. Authentication Endpoints (Public)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/` | Login and receive a 1-hour JWT token |

### 2. Patient Management (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/patients/` | Create a new patient |
| `GET` | `/api/patients/` | List all patients created by the logged-in user |
| `GET` | `/api/patients/:id/` | Retrieve one patient by ID (ownership checked) |
| `PUT` | `/api/patients/:id/` | Update patient details |
| `DELETE` | `/api/patients/:id/` | Delete a patient |

### 3. Doctor Management (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/doctors/` | Create a new doctor profile |
| `GET` | `/api/doctors/` | List all doctors created by the logged-in user |
| `GET` | `/api/doctors/:id/` | Retrieve one doctor by ID (ownership checked) |
| `PUT` | `/api/doctors/:id/` | Update doctor details |
| `DELETE` | `/api/doctors/:id/` | Delete a doctor profile |

### 4. Patient-Doctor Mappings (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mappings/` | Assign a doctor to a patient |
| `GET` | `/api/mappings/` | List all mappings created by the logged-in user |
| `GET` | `/api/mappings/:patient_id/` | Retrieve all doctors assigned to a specific patient |
| `DELETE` | `/api/mappings/:id/` | Remove a doctor assignment |

---

## API Testing & Request Examples (cURL & Postman)

All endpoints can be tested via Postman, Thunder Client, or cURL.

### Header Required on All Protected Routes:
```text
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### 1. Authentication
#### Register (`POST /api/auth/register/`)
- **Body**:
  ```json
  {
    "name": "Dr. Sarah Adams",
    "email": "sarah.adams@hospital.com",
    "password": "Password123"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "user": { "id": 1, "name": "Dr. Sarah Adams", "email": "sarah.adams@hospital.com" }
  }
  ```

#### Login (`POST /api/auth/login/`)
- **Body**:
  ```json
  {
    "email": "sarah.adams@hospital.com",
    "password": "Password123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "name": "Dr. Sarah Adams", "email": "sarah.adams@hospital.com" }
  }
  ```

---

### 2. Patients
#### Create Patient (`POST /api/patients/`)
- **Body**:
  ```json
  {
    "name": "Alice Smith",
    "age": 35,
    "gender": "Female",
    "address": "123 Elm Street"
  }
  ```
- **Response**: `201 Created`

#### List Patients (`GET /api/patients/`)
- **Response**: `200 OK` with `{ "success": true, "count": 1, "data": [...] }`

#### Get Patient by ID (`GET /api/patients/1/`)
- **Response**: `200 OK` with patient details

#### Update Patient (`PUT /api/patients/1/`)
- **Body**:
  ```json
  {
    "age": 36,
    "address": "456 Oak Avenue"
  }
  ```
- **Response**: `200 OK`

#### Delete Patient (`DELETE /api/patients/1/`)
- **Response**: `200 OK` with `{ "success": true, "message": "Patient deleted successfully." }`

---

### 3. Doctors
#### Create Doctor (`POST /api/doctors/`)
- **Body**:
  ```json
  {
    "name": "Dr. Gregory House",
    "specialization": "Diagnostics",
    "email": "house@hospital.com",
    "phone": "+1-555-0199"
  }
  ```
- **Response**: `201 Created`

#### List Doctors (`GET /api/doctors/`)
- **Response**: `200 OK`

#### Get Doctor by ID (`GET /api/doctors/1/`)
- **Response**: `200 OK`

#### Update Doctor (`PUT /api/doctors/1/`)
- **Body**:
  ```json
  {
    "phone": "+1-555-9988"
  }
  ```
- **Response**: `200 OK`

#### Delete Doctor (`DELETE /api/doctors/1/`)
- **Response**: `200 OK`

---

### 4. Mappings
#### Assign Doctor to Patient (`POST /api/mappings/`)
- **Body**:
  ```json
  {
    "patientId": 1,
    "doctorId": 1
  }
  ```
- **Response**: `201 Created` (includes nested patient and doctor objects)

#### List All Mappings (`GET /api/mappings/`)
- **Response**: `200 OK` (includes nested patient and doctor objects)

#### Get Doctors for Specific Patient (`GET /api/mappings/1/`)
- **Response**: `200 OK` with patient profile and list of assigned doctors

#### Delete Mapping (`DELETE /api/mappings/1/`)
- **Response**: `200 OK` with `{ "success": true, "message": "Doctor assignment removed successfully." }`

---

