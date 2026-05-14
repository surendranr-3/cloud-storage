# CloudVault – Cloud-Based File Storage System

A full‑stack Google Drive clone with React, Node.js, AWS S3, and RDS.

## 🚀 Live Demo

- **Frontend:** [http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login](http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login)
- **Backend API:** `http://65.0.89.9:5000/api`

## ✨ Features

### Core Features ✅

- User registration & login (JWT authentication, 7-day token expiry)
- Upload, download, delete files
- File sharing with viewer/editor roles
- Fully mobile‑responsive UI
- Passwords hashed with bcrypt (10 salt rounds)
- Metadata stored in AWS RDS (PostgreSQL), files in S3
- S3 Server-Side Encryption (AES-256)

### Enterprise Features 🏆 (NEW)

- **Folder Hierarchy**: Create nested folders with parent-child relationships
- **Version History**: Automatic version tracking - restore any previous file version
- **Advanced Search**: Search files by name, type, date range, and size
- **Professional API Docs**: Swagger/OpenAPI documentation at `/api-docs`

## 🧱 Architecture

```
React Frontend (S3 static) → REST API → Node.js/Express Backend (EC2)
│
┌───────────────┼───────────────┐
│ │ │
AWS RDS AWS S3 JWT Auth
(file metadata) (file storage)
```

## 📦 Setup & Installation

### Prerequisites

- Node.js v16+
- AWS account (S3 bucket + RDS instance)
- Git

### Backend (Node.js/Express)

```bash
git clone https://github.com/surendranr-3/cloud-storage.git
cd cloud-storage
npm install
```

Create a `.env` file:

```
PORT=5000
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASSWORD=yourpassword
DB_NAME=cloudvault
AWS_ACCESS_KEY_ID=yourkey
AWS_SECRET_ACCESS_KEY=yoursecret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket
JWT_SECRET=yourrandomsecret
```

Run the server:

```bash
npm start
```

### Frontend (React)

```bash
cd frontend
npm install
npm start   # Opens at http://localhost:3000
```

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint           | Auth | Description    |
| ------ | ------------------ | ---- | -------------- |
| POST   | /api/auth/register | No   | Create account |
| POST   | /api/auth/login    | No   | Login → JWT    |

### 📁 Files (Core)

| Method | Endpoint                  | Auth | Description          |
| ------ | ------------------------- | ---- | -------------------- |
| GET    | /api/files                | Yes  | List user files      |
| POST   | /api/files/upload         | Yes  | Upload (multipart)   |
| GET    | /api/files/:id/download   | Yes  | Get presigned URL    |
| DELETE | /api/files/:id            | Yes  | Delete file          |
| POST   | /api/files/:id/share      | Yes  | Share file           |
| GET    | /api/files/shared-with-me | Yes  | Files shared with me |

### 📁 Folders (NEW)

| Method | Endpoint                  | Auth | Description              |
| ------ | ------------------------- | ---- | ------------------------ |
| POST   | /api/folders              | Yes  | Create folder            |
| GET    | /api/folders              | Yes  | List folders             |
| GET    | /api/folders/:id/files    | Yes  | List files in folder     |
| GET    | /api/folders/:id/children | Yes  | List subfolders          |
| PUT    | /api/folders/:id          | Yes  | Rename/move folder       |
| DELETE | /api/folders/:id          | Yes  | Delete folder & contents |

### 📜 Version History (NEW)

| Method | Endpoint                                  | Auth | Description       |
| ------ | ----------------------------------------- | ---- | ----------------- |
| GET    | /api/versions/:fileId/versions            | Yes  | List all versions |
| GET    | /api/versions/:fileId/versions/:versionId | Yes  | Download version  |
| POST   | /api/versions/:fileId/restore/:versionId  | Yes  | Restore version   |

### 🔍 Search (NEW)

| Method | Endpoint                | Auth | Description                            |
| ------ | ----------------------- | ---- | -------------------------------------- |
| GET    | /api/files/search?q=... | Yes  | Search files by name, type, date, size |

### 📚 API Documentation (NEW)

- **Endpoint**: `http://localhost:5000/api-docs`
- **Format**: Interactive Swagger UI with OpenAPI 3.0 specification
- **Features**: Try-it-out functionality, parameter validation, response examples

## 🛡️ Security

- Passwords hashed with bcrypt
- JWT protected routes
- S3 objects set to private ACL
- CORS enabled for frontend domain

## 📂 Project Structure

```
cloud-storage/
├── server.js                   # Express app with Swagger setup
├── swagger.js                  # OpenAPI 3.0 specification (NEW)
├── routes/
│   ├── auth.js                 # Register & login
│   ├── files.js                # File CRUD, sharing, search (UPDATED)
│   ├── folders.js              # Folder hierarchy (NEW)
│   └── versions.js             # File version history (NEW)
├── middleware/
│   └── auth.js                 # JWT verification
├── migrations/
│   └── 001_add_folders_and_versions.sql  # Database migration (NEW)
├── db.js                       # PostgreSQL connection pool
├── s3.js                       # S3 configuration
├── frontend/                   # React app
│   ├── public/index.html
│   ├── src/
│   │   ├── api.js              # Axios setup
│   │   ├── pages/              # UI pages
│   │   └── App.js
│   └── package.json
├── .env.example
└── README.md
```

## 🗄️ Database Schema (NEW)

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),  -- bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Files Table

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name VARCHAR(255),
  size_bytes BIGINT,
  mime_type VARCHAR(255),
  s3_key VARCHAR(1024),
  folder_id INTEGER,          -- NEW: Which folder file is in
  is_version BOOLEAN,         -- NEW: Flag if this is a version
  version_of_id INTEGER,      -- NEW: If version, which file it belongs to
  created_at TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (version_of_id) REFERENCES files(id)
);
```

### Folders Table (NEW)

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name VARCHAR(255),
  parent_id INTEGER,  -- NULL for root folders, otherwise FK to parent
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id),
  UNIQUE(owner_id, name, parent_id)  -- Unique names per parent
);
```

### File Versions Table (NEW)

```sql
CREATE TABLE file_versions (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL,
  version_number INTEGER,
  s3_key VARCHAR(1024),
  size_bytes BIGINT,
  mime_type VARCHAR(255),
  created_by_id INTEGER,
  created_at TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);
```

### Permissions Table

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(50),  -- 'viewer' or 'editor'
  created_at TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔄 Running Database Migrations

```bash
# Apply migration to your RDS PostgreSQL database
psql postgresql://user:password@host:5432/cloudvault < migrations/001_add_folders_and_versions.sql

# This will create:
# - folders table with parent-child relationships
# - file_versions table for version history
# - Add folder_id, is_version, version_of_id columns to files
# - Create indexes for performance (owner_id, parent_id, full-text search)
```

## 📈 Deployment & Monitoring

- **Frontend** – Built and deployed to S3 static website hosting
- **Backend** – Running on EC2 (AMI Linux 2)
- **Database** – RDS PostgreSQL (with full-text search indexes)
- **Storage** – S3 bucket (with AES-256 encryption)
- **API Docs** – Swagger UI at `/api-docs` (NEW)
- **Monitoring** – Future integration with CloudWatch (logs, metrics)

```
cloud-storage
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ db.js
│  ├─ middleware
│  │  └─ auth.js
│  ├─ migrations
│  │  └─ 001_add_folders_and_versions.sql
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ auth.js
│  │  ├─ files.js
│  │  ├─ folders.js
│  │  └─ versions.js
│  ├─ s3.js
│  ├─ server.js
│  └─ swagger.js
├─ ENTERPRISE_FEATURES_SUMMARY.md
├─ frontend
│  ├─ .env.example
│  ├─ build
│  │  ├─ asset-manifest.json
│  │  ├─ favicon.ico
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  ├─ robots.txt
│  │  └─ static
│  │     ├─ css
│  │     │  ├─ main.fc5f11b3.css
│  │     │  └─ main.fc5f11b3.css.map
│  │     └─ js
│  │        ├─ main.76ba6294.js
│  │        ├─ main.76ba6294.js.LICENSE.txt
│  │        └─ main.76ba6294.js.map
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.ico
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  ├─ README.md
│  └─ src
│     ├─ api.js
│     ├─ App.css
│     ├─ App.js
│     ├─ App.test.js
│     ├─ components
│     ├─ index.css
│     ├─ index.js
│     ├─ logo.svg
│     ├─ pages
│     │  ├─ Auth.css
│     │  ├─ Dashboard.css
│     │  ├─ Dashboard.js
│     │  ├─ Login.js
│     │  └─ Register.js
│     ├─ reportWebVitals.js
│     └─ setupTests.js
└─ README.md

```