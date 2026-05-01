# CloudVault – Cloud-Based File Storage System

A full‑stack Google Drive clone with React, Node.js, AWS S3, and RDS.

## 🚀 Live Demo

- **Frontend:** [http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login](http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login)
- **Backend API:** `http://65.0.89.9:5000/api`

## ✨ Features

- User registration & login (JWT authentication)
- Upload, download, delete files
- File sharing via generated links
- Fully mobile‑responsive UI
- Passwords hashed with bcrypt
- Metadata stored in AWS RDS (MySQL), files in S3

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

| Method | Endpoint                 | Auth | Description         |
| ------ | ------------------------ | ---- | ------------------- |
| POST   | /api/auth/register       | No   | Create account      |
| POST   | /api/auth/login          | No   | Login → JWT         |
| GET    | /api/files               | Yes  | List user files     |
| POST   | /api/files/upload        | Yes  | Upload (multipart)  |
| GET    | /api/files/download/:id  | Yes  | Download file       |
| DELETE | /api/files/:id           | Yes  | Delete file         |
| POST   | /api/files/share/:id     | Yes  | Generate share link |
| GET    | /api/files/public/:token | No   | Access shared file  |

## 🛡️ Security

- Passwords hashed with bcrypt
- JWT protected routes
- S3 objects set to private ACL
- CORS enabled for frontend domain

## 📂 Project Structure

```
cloud-storage/
├── server.js              # Entry point
├── routes/
│   ├── auth.js            # Register & login
│   └── files.js           # File CRUD & sharing
├── middleware/
│   └── auth.js            # JWT verification
├── db.js                  # RDS connection pool
├── s3.js                  # S3 configuration
├── frontend/              # React app
│   ├── public/index.html
│   ├── src/
│   │   ├── api.js         # Axios setup
│   │   ├── pages/         # UI pages
│   │   └── App.js
│   └── package.json
├── .env.example
└── README.md
```

## 📈 Deployment & Monitoring

- **Frontend** – Built and deployed to S3 static website hosting
- **Backend** – Running on EC2 (AMI Linux 2)
- **Database** – RDS MySQL
- **Storage** – S3 bucket
- **Monitoring** – Future integration with CloudWatch (logs, metrics)
