# CloudVault - Cloud-Based Online File Storage System

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Deployed-orange)](https://aws.amazon.com/)

A modern, secure, and cloud-powered file storage application inspired by Google Drive. Built with React.js, Node.js, PostgreSQL, and AWS S3 with full cloud deployment on AWS.

## Table of Contents

- [Live Application](#-live-application)
- [Features](#-features)
- [Project Objective](#-project-objective)
- [System Architecture](#️-system-architecture)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Database Schema](#️-database-schema)
- [API Documentation](#-api-documentation)
- [Deployment](#️-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Live Application

- **Frontend (CloudFront HTTPS)**  
  [https://d34sqa3840006d.cloudfront.net/login](https://d34sqa3840006d.cloudfront.net/login)

- **Backend API (HTTPS)**  
  [https://stoorage.duckdns.org/api](https://stoorage.duckdns.org/api)

---

## 📌 Project Objective

Develop a complete cloud-based online file storage system that allows users to:

- ✅ Create secure accounts with JWT authentication
- ✅ Upload and manage files in cloud storage
- ✅ Download files from cloud storage
- ✅ Organize files into folders with nested structure support
- ✅ Share files securely with controlled access permissions
- ✅ Maintain file version history and restore older versions
- ✅ Access files from anywhere through the internet

This system simulates core functionalities of platforms like Google Drive and Dropbox using modern cloud technologies.

---

## 🏗️ System Architecture

```
User Browser
    ↓
CloudFront CDN (HTTPS)
    ↓
React Frontend (AWS S3 Static Hosting)
    ↓
HTTPS API Requests
    ↓
DuckDNS Domain
    ↓
Nginx Reverse Proxy
    ↓
Node.js Express Backend (AWS EC2)
    ↓
PostgreSQL RDS Database
    ↓
AWS S3 Cloud Storage
```

## ☁️ Cloud Deployment Services

| Service          | Technology Used           |
| ---------------- | ------------------------- |
| Cloud Provider   | Amazon Web Services (AWS) |
| Frontend Hosting | AWS S3 + CloudFront CDN   |
| Backend Hosting  | AWS EC2 (Ubuntu Server)   |
| Database         | PostgreSQL (AWS RDS)      |
| Cloud Storage    | AWS S3                    |
| Domain Provider  | DuckDNS                   |
| HTTPS SSL        | Let's Encrypt + Nginx     |
| Process Manager  | PM2                       |

---

## ✨ Features

### 🔐 Authentication & Security

- User registration and login with email verification
- JWT-based authentication for API security
- Password hashing using bcryptjs
- Protected API routes with middleware
- Secure HTTPS communication (Let's Encrypt SSL)

### 📂 File Management

- Upload files to AWS S3
- Download files securely
- Delete files from storage
- View uploaded files with metadata
- File size tracking and management

### 📁 Folder Management

- Create and organize folders
- Organize uploaded files by folders
- Nested folder structure support
- Delete folders and manage hierarchy

### 🔄 File Version Control

- Maintain complete file history
- Store multiple versions of files
- Restore older file versions
- Version tracking and management

### 🤝 File Sharing

- Share uploaded files with other users
- Controlled access permissions
- Revoke shared access anytime

### 📱 Responsive UI

- Fully responsive design
- Mobile-friendly interface
- Dashboard-based layout with intuitive navigation
- Clean and modern user interface

---

## 🛠️ Technologies Used

### Frontend

- **React.js** - UI library
- **HTML5 / CSS3 / JavaScript** - Web standards
- **Axios** - HTTP client for API calls

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Database

- **PostgreSQL** - Primary database (AWS RDS)

### Cloud & Deployment

- **AWS EC2** - Backend hosting
- **AWS S3** - File storage
- **AWS CloudFront** - CDN for frontend
- **Nginx** - Reverse proxy
- **PM2** - Process manager
- **DuckDNS** - Dynamic DNS
- **Let's Encrypt** - SSL certificates

---

## � Project Structure

```
cloud-storage/
├── backend/
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication middleware
│   ├── migrations/
│   │   └── 001_add_folders_and_versions.sql  # Database migrations
│   ├── routes/
│   │   ├── auth.js                    # Authentication endpoints
│   │   ├── files.js                   # File management endpoints
│   │   ├── folders.js                 # Folder management endpoints
│   │   └── versions.js                # Version control endpoints
│   ├── db.js                          # Database configuration
│   ├── s3.js                          # AWS S3 configuration
│   ├── server.js                      # Express server setup
│   ├── swagger.js                     # Swagger/OpenAPI documentation
│   └── package.json                   # Node.js dependencies
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── api.js                     # API client configuration
│   │   ├── App.js                     # Main App component
│   │   ├── App.css
│   │   ├── index.js                   # React entry point
│   │   └── index.css
│   ├── build/                         # Production build
│   └── package.json                   # React dependencies
│
└── README.md                          # This file
```

---

## 🚀 Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)
- **AWS Account** (for S3 and deployment) - [Sign up](https://aws.amazon.com/)

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file with the following variables:**

   ```env
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=cloud_storage
   DB_PORT=5432

   JWT_SECRET=your_jwt_secret_key

   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_bucket_name

   NODE_ENV=development
   PORT=5000
   ```

4. **Set up PostgreSQL database:**

   ```bash
   createdb cloud_storage
   psql -U postgres -d cloud_storage -f migrations/001_add_folders_and_versions.sql
   ```

5. **Start the backend server:**

   ```bash
   npm start
   ```

   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file:**

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server:**

   ```bash
   npm start
   ```

   Frontend will run on `http://localhost:3000`

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🗄️ Database Schema

### Users Table

| Column        | Type           | Description                |
| ------------- | -------------- | -------------------------- |
| id            | SERIAL         | Primary key                |
| name          | VARCHAR        | User's full name           |
| email         | VARCHAR UNIQUE | User's email (unique)      |
| password_hash | TEXT           | Hashed password            |
| created_at    | TIMESTAMP      | Account creation timestamp |

### Files Table

| Column      | Type      | Description           |
| ----------- | --------- | --------------------- |
| id          | SERIAL    | Primary key           |
| user_id     | INTEGER   | Foreign key (Users)   |
| file_name   | TEXT      | Name of the file      |
| file_url    | TEXT      | S3 file URL           |
| file_size   | BIGINT    | File size in bytes    |
| uploaded_at | TIMESTAMP | Upload timestamp      |
| folder_id   | INTEGER   | Foreign key (Folders) |

### Folders Table

| Column    | Type    | Description                 |
| --------- | ------- | --------------------------- |
| id        | SERIAL  | Primary key                 |
| user_id   | INTEGER | Foreign key (Users)         |
| name      | TEXT    | Folder name                 |
| parent_id | INTEGER | For nested folder structure |

### File Metadata Table

| Column    | Type    | Description         |
| --------- | ------- | ------------------- |
| id        | SERIAL  | Primary key         |
| file_id   | INTEGER | Foreign key (Files) |
| mime_type | TEXT    | File MIME type      |
| version   | INTEGER | Version number      |

### Permissions Table

| Column          | Type    | Description                   |
| --------------- | ------- | ----------------------------- |
| id              | SERIAL  | Primary key                   |
| file_id         | INTEGER | Foreign key (Files)           |
| shared_with     | INTEGER | User ID (Foreign key - Users) |
| permission_type | TEXT    | Type (read, write, admin)     |

---

## 🔌 API Documentation

**Base URL:** `https://stoorage.duckdns.org/api`

### 🔐 Authentication APIs

#### Register User

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 📂 File APIs

| Method | Endpoint                  | Description        | Auth Required |
| ------ | ------------------------- | ------------------ | ------------- |
| POST   | `/api/files/upload`       | Upload a new file  | Yes           |
| GET    | `/api/files`              | Get all user files | Yes           |
| GET    | `/api/files/:id`          | Get file details   | Yes           |
| DELETE | `/api/files/:id`          | Delete a file      | Yes           |
| GET    | `/api/files/:id/download` | Download a file    | Yes           |

### 📁 Folder APIs

| Method | Endpoint           | Description        | Auth Required |
| ------ | ------------------ | ------------------ | ------------- |
| POST   | `/api/folders`     | Create a folder    | Yes           |
| GET    | `/api/folders`     | Get all folders    | Yes           |
| GET    | `/api/folders/:id` | Get folder details | Yes           |
| DELETE | `/api/folders/:id` | Delete a folder    | Yes           |

### 🔄 Version APIs

| Method | Endpoint                           | Description                  | Auth Required |
| ------ | ---------------------------------- | ---------------------------- | ------------- |
| GET    | `/api/versions/:fileId`            | Get all file versions        | Yes           |
| POST   | `/api/versions/:fileId`            | Create a new file version    | Yes           |
| GET    | `/api/versions/:versionId`         | Get specific version details | Yes           |
| PUT    | `/api/versions/:versionId/restore` | Restore to this version      | Yes           |

---

## ☁️ AWS Services Used

### AWS S3

- Secure file storage
- Object management
- Scalable cloud storage for all uploaded files

### AWS RDS PostgreSQL

- User account data
- File metadata storage
- Permission management
- Folder structure

### AWS EC2

- Hosting Node.js backend
- Running Express APIs
- PM2 process management

### AWS CloudFront

- HTTPS frontend delivery
- CDN caching for fast access
- Global content distribution

---

## 🚀 Deployment Guide

### Deploying Backend to AWS EC2

1. **Connect to EC2 instance via SSH**
2. **Clone the repository**
3. **Install Node.js and PM2**
4. **Configure environment variables**
5. **Install dependencies:** `npm install`
6. **Start with PM2:** `pm2 start server.js --name "cloud-storage-api"`

### Deploying Frontend to AWS S3 & CloudFront

1. **Build the React app:** `npm run build`
2. **Upload to S3 bucket:** `aws s3 sync build/ s3://your-bucket-name/`
3. **Invalidate CloudFront cache:** `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a new branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Commit your changes:** `git commit -m 'Add your feature'`
5. **Push to the branch:** `git push origin feature/your-feature-name`
6. **Open a Pull Request**

### Code Style Guidelines

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Use meaningful variable names
- Add comments for complex logic
- Test your changes before submitting

## 📧 Contact & Support

For questions, bug reports, or suggestions, please open an issue in the repository or contact the maintainers.

**Happy coding! 🚀**
