# CloudVault - Cloud-Based Online File Storage System

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Deployed-orange)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A modern, secure, and cloud-powered file storage application inspired by Google Drive.  
Built with React.js, Node.js, PostgreSQL, and AWS S3 with full cloud deployment on AWS.

---

## 🌐 Live Application

- **Frontend (CloudFront HTTPS)**  
  [https://d34sqa3840006d.cloudfront.net/login](https://d34sqa3840006d.cloudfront.net/login)

- **Backend API (HTTPS)**  
  [https://stoorage.duckdns.org/api](https://stoorage.duckdns.org/api)

---

## 📌 Project Objective

Develop a complete cloud-based online file storage system that allows users to:

- Create secure accounts
- Upload and manage files
- Download files from cloud storage
- Organize files into folders
- Share files securely
- Maintain file version history
- Access files from anywhere through the internet

This system simulates core functionalities of platforms like Google Drive and Dropbox using modern cloud technologies.

---

## ☁️ Cloud Deployment

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

## 🏗️ System Architecture

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

text

---

## ✨ Features

### 🔐 Authentication & Security

- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Secure HTTPS communication

### 📂 File Management

- Upload files to AWS S3
- Download files securely
- Delete files
- View uploaded files
- File metadata storage

### 📁 Folder Management

- Create folders
- Organize uploaded files
- Nested folder structure support

### 🔄 File Version Control

- Maintain file history
- Store multiple versions
- Restore older file versions

### 🤝 File Sharing

- Share uploaded files
- Controlled access permissions

### 📱 Responsive UI

- Fully responsive design
- Mobile-friendly interface
- Dashboard-based layout

---

## 📁 Project Structure

cloud-storage/
├── backend/
│ ├── middleware/
│ ├── migrations/
│ ├── routes/
│ ├── db.js
│ ├── s3.js
│ ├── server.js
│ ├── swagger.js
│ ├── package.json
│ └── .env
│
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── pages/
│ │ ├── api.js
│ │ ├── App.js
│ │ └── index.js
│ ├── build/
│ └── package.json
│
└── README.md

text

---

## 🛠️ Technologies Used

### Frontend

- React.js
- HTML5 / CSS3 / JavaScript
- Axios

### Backend

- Node.js
- Express.js
- JWT Authentication
- bcryptjs

### Database

- PostgreSQL (AWS RDS)

### Cloud & Deployment

- AWS EC2
- AWS S3
- AWS CloudFront
- Nginx
- PM2
- DuckDNS
- Let's Encrypt SSL

---

## 🗄️ Database Schema

### Users Table

| Column        | Type           |
| ------------- | -------------- |
| id            | SERIAL         |
| name          | VARCHAR        |
| email         | VARCHAR UNIQUE |
| password_hash | TEXT           |

### Files Table

| Column      | Type      |
| ----------- | --------- |
| id          | SERIAL    |
| user_id     | INTEGER   |
| file_name   | TEXT      |
| file_url    | TEXT      |
| file_size   | BIGINT    |
| uploaded_at | TIMESTAMP |

### File Metadata Table

| Column    | Type    |
| --------- | ------- |
| id        | SERIAL  |
| file_id   | INTEGER |
| mime_type | TEXT    |
| version   | INTEGER |

### Permissions Table

| Column          | Type    |
| --------------- | ------- |
| id              | SERIAL  |
| file_id         | INTEGER |
| shared_with     | INTEGER |
| permission_type | TEXT    |

---

## 🔌 API Documentation

**Base URL:** `https://stoorage.duckdns.org/api`

### 🔐 Authentication APIs

#### Register User

```http
POST /api/auth/register
Request Body:

json
{
  "name": "Ram",
  "email": "ram@gmail.com",
  "password": "ram123"
}
Login User
http
POST /api/auth/login
Request Body:

json
{
  "email": "ram@gmail.com",
  "password": "ram123"
}
Response:

json
{
  "token": "JWT_TOKEN"
}
📂 File APIs
Method	Endpoint	Description
POST	/api/files/upload	Upload file
GET	/api/files	Get user files
DELETE	/api/files/:id	Delete file
📁 Folder APIs
Method	Endpoint	Description
POST	/api/folders	Create folder
GET	/api/folders	Get folders
🔄 Version APIs
Method	Endpoint	Description
GET	/api/versions/:fileId	Get all file versions
☁️ AWS Services Used
AWS S3
File storage

Object management

Scalable cloud storage

AWS RDS PostgreSQL
User data

File metadata

Permissions

Folder structure

AWS EC2
Hosting Node.js backend

Running Express APIs

PM2 process management

AWS CloudFront
HTTPS frontend delivery

CDN caching

Faster global access

🚀 Deployment Steps
1. Launch EC2 Instance
Ubuntu Server

Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (Backend)

2. Connect to EC2
bash
ssh -i key.pem ubuntu@your-ip
3. Install Dependencies
bash
sudo apt update
sudo apt install nodejs npm nginx git -y
4. Clone Repository
bash
git clone https://github.com/yourusername/cloud-storage.git
cd cloud-storage
5. Install Backend Dependencies
bash
cd backend
npm install
6. Configure Environment Variables
Create .env file:

env
PORT=5000
JWT_SECRET=your_secret
DB_URL=postgresql://username:password@host/database
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=ap-south-1
AWS_BUCKET=your_bucket
7. Start Backend Server with PM2
bash
pm2 start server.js --name cloud-api
pm2 save
8. Configure Nginx Reverse Proxy
nginx
server {
    server_name stoorage.duckdns.org;

    location / {
        proxy_pass http://localhost:5000;
    }
}
9. Enable HTTPS with Let's Encrypt
bash
sudo certbot --nginx -d stoorage.duckdns.org
10. Deploy Frontend
Build React app: npm run build

Upload build/ folder to AWS S3 bucket

Enable static website hosting and public access

Create CloudFront distribution pointing to the S3 bucket

Configure custom error pages:

Error Code	Response Page	HTTP Code
403	/index.html	200
404	/index.html	200
📊 Monitoring & Logs
bash
# View PM2 logs
pm2 logs

# Check PM2 status
pm2 status
🧪 Testing
The application was tested with:

Multiple user accounts

Concurrent file uploads

Large file handling

JWT authentication

CloudFront HTTPS routing

API integration

File version retrieval

📚 Dataset References
Drive File Data

Cloud Storage Dataset

📖 Reference Projects
Cloud File Storage System

AWS Cloud Drive Sample

Cloud Storage App

🐛 Troubleshooting
Problem	Solution
API not responding	Check PM2 status (pm2 status)
HTTPS issue	Verify Nginx SSL configuration
React routes not working	Add CloudFront custom error pages (403/404)
File upload failing	Verify S3 bucket permissions
Database connection error	Check RDS security group inbound rules
Mixed content error	Use HTTPS backend URL
👨‍💻 Author
Surendran

🚀 Final Submission
Live Frontend: https://d34sqa3840006d.cloudfront.net/login

Backend API: https://stoorage.duckdns.org/api

GitHub Repository: https://github.com/yourusername/cloud-storage

🏁 Conclusion
This project demonstrates the complete development and deployment lifecycle of a modern cloud-native file storage application using AWS services. It includes secure authentication, scalable cloud storage, REST APIs, responsive frontend design, HTTPS deployment, and production-ready cloud architecture similar to enterprise file storage platforms like Google Drive.
```
