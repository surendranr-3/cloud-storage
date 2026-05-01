# CloudVault - Cloud-Based Online File Storage System

A full-stack Google Drive clone built with **React**, **Node.js**, **PostgreSQL**, and **AWS S3**. Features user authentication, file upload/download, sharing, and mobile-responsive design.

![CloudVault](https://img.shields.io/badge/status-production-brightgreen)
![React](https://img.shields.io/badge/frontend-React-blue)
![Node.js](https://img.shields.io/badge/backend-Node.js-green)
![AWS](https://img.shields.io/badge/storage-AWS%20S3-orange)

---

## 🚀 Quick Links

- **Live Demo (Frontend)**: [CloudVault Login](http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login)
- **Backend API**: `http://65.0.89.9:5000/api`
- **GitHub Repository**: [surendranr-3/cloud-storage](https://github.com/surendranr-3/cloud-storage)

---

## ✨ Features

### Authentication & Security
- ✅ User registration & login with JWT tokens
- ✅ Passwords hashed with bcrypt
- ✅ Protected routes requiring authentication
- ✅ Automatic token refresh on 401 errors

### File Management
- ✅ Upload files up to 500 MB
- ✅ Download files with presigned S3 URLs (15-minute expiry)
- ✅ Delete files from S3 and database
- ✅ List all uploaded files with metadata
- ✅ Display file size, type, and upload date

### File Sharing
- ✅ Generate shareable links for files
- ✅ Public access to shared files without authentication
- ✅ Track shared files with access metadata

### User Experience
- ✅ Grid and list view for files
- ✅ Search and filter functionality
- ✅ Real-time upload progress tracking
- ✅ Drag-and-drop file upload
- ✅ Storage quota display (50 GB limit per user)
- ✅ Mobile-responsive design (works on desktop, tablet, mobile)
- ✅ Toast notifications for user feedback

---

## 🧱 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudVault Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)         Backend (Node.js/Express)         │
│  ┌──────────────────┐    ┌──────────────────────────┐       │
│  │ - Login/Register │───→│ /api/auth/register      │       │
│  │ - Dashboard      │←───│ /api/auth/login         │       │
│  │ - File Upload    │    │ /api/files/upload       │       │
│  │ - File List      │    │ /api/files/:id/download │       │
│  │ - File Sharing   │    │ /api/files/:id          │       │
│  └──────────────────┘    │ /api/files/:id/share    │       │
│         HTTP/REST        └──────────────────────────┘       │
│                                  │                           │
│         ┌───────────────┬────────┴────────┬──────────┐      │
│         │               │                  │          │      │
│    ┌────▼────┐   ┌─────▼──────┐  ┌──────▼──┐  ┌──┐  │      │
│    │PostgreSQL│   │   AWS S3   │  │   JWT   │  │..│  │      │
│    │Database  │   │  (500 MB)  │  │  Auth   │  └──┘  │      │
│    │(Metadata)│   │(File Store)│  │ Verify  │        │      │
│    └──────────┘   └────────────┘  └─────────┘        │      │
│                                                        │      │
└────────────────────────────────────────────────────────┘      │
```

### Components

- **Frontend**: React SPA with routing, state management, and responsive UI
- **Backend**: Express.js REST API with JWT authentication middleware
- **Database**: PostgreSQL for user accounts and file metadata
- **Storage**: AWS S3 for secure file storage with AES-256 encryption
- **Authentication**: JWT tokens (7-day expiry) for secure API access

---

## 📦 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, React Router, Axios, CSS3 (Mobile Responsive) |
| **Backend** | Node.js, Express.js, PostgreSQL, JWT, Bcrypt |
| **Cloud** | AWS S3 (file storage), AWS RDS (PostgreSQL), AWS EC2 (backend hosting) |
| **Security** | AES-256 encryption, bcrypt hashing, JWT tokens, HTTPS |

---

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **AWS Account** with S3 bucket and RDS PostgreSQL instance
- **PostgreSQL** client (optional, for local development)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/surendranr-3/cloud-storage.git
cd cloud-storage
```

### 2️⃣ Backend Setup

Navigate to backend directory:

```bash
cd backend
npm install
```

Create `.env` file with your configuration:

```env
# Server Configuration
PORT=5000

# Database (PostgreSQL)
DB_URL=postgresql://user:password@your-rds-endpoint:5432/cloudvault

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET=your-s3-bucket-name

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this
```

**Create PostgreSQL database tables** (run this once):

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  size_bytes BIGINT,
  mime_type VARCHAR(100),
  s3_key VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared files table
CREATE TABLE shared_files (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

Start the backend server:

```bash
npm start
```

Expected output:
```
✅ S3 connected! Buckets: [your-bucket-name]
Server running on port 5000
```

### 3️⃣ Frontend Setup

Navigate to frontend directory (in a new terminal):

```bash
cd frontend
npm install
```

Create `.env.local` file:

```env
# Production backend URL
REACT_APP_API_URL=http://65.0.89.9:5000/api

# For local development, use:
# REACT_APP_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm start
```

React app will open at `http://localhost:3000`

### 4️⃣ Verify Setup

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **Register** to create a test account
3. Fill in name, email, password (min 6 chars)
4. Click **Login** with your new credentials
5. You should see the Dashboard with file upload area
6. Try uploading a file to test S3 integration

---

## 🔌 API Endpoints

All endpoints require JWT authentication except `/auth/register`, `/auth/login`, and `/files/public/:shareToken`.

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user account |
| `POST` | `/api/auth/login` | No | Login and receive JWT token |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### File Management Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/files/upload` | Yes | Upload file to S3 |
| `GET` | `/api/files` | Yes | List user's files |
| `GET` | `/api/files/:id/download` | Yes | Get presigned download URL |
| `DELETE` | `/api/files/:id` | Yes | Delete file from S3 |

**Upload File (Multipart):**
```bash
curl -X POST \
  http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

**Download File:**
```bash
# Get presigned URL
curl -X GET \
  http://localhost:5000/api/files/123/download \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: { "url": "https://s3.amazonaws.com/..." }
# Use URL to download directly from S3
```

---

## 📁 Project Structure

```
cloud-storage/
│
├── backend/                          # Node.js Express Backend
│   ├── server.js                     # Main server entry point
│   ├── db.js                         # PostgreSQL connection pool
│   ├── s3.js                         # AWS S3 client configuration
│   ├── package.json                  # Backend dependencies
│   ├── .env.example                  # Environment variables template
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT verification middleware
│   │
│   └── routes/
│       ├── auth.js                   # Login & Registration endpoints
│       └── files.js                  # File CRUD & Sharing endpoints
│
├── frontend/                         # React Frontend (SPA)
│   ├── src/
│   │   ├── App.js                    # Root component & routing
│   │   ├── App.css                   # Global styles
│   │   ├── api.js                    # Axios API client
│   │   │
│   │   └── pages/
│   │       ├── Login.js              # Login page
│   │       ├── Register.js           # Registration page
│   │       ├── Dashboard.js          # Main file management dashboard
│   │       ├── Auth.css              # Auth page styles
│   │       └── Dashboard.css         # Dashboard styles (responsive)
│   │
│   ├── public/
│   │   ├── index.html                # HTML entry point
│   │   ├── favicon.ico               # App icon
│   │   └── manifest.json             # PWA manifest
│   │
│   ├── package.json                  # Frontend dependencies
│   └── .env.example                  # Environment variables template
│
└── README.md                         # This file
```

---

## 🔒 Security Features

### Backend Security

- **JWT Authentication**: Tokens expire in 7 days
- **Password Hashing**: bcryptjs with 10 salt rounds
- **S3 Encryption**: AES-256 server-side encryption enabled
- **Presigned URLs**: 15-minute expiry on download links
- **CORS**: Configured for trusted origins only

### Frontend Security

- **Token Storage**: JWT stored in localStorage
- **Auto Logout**: Invalid tokens redirect to login
- **Input Validation**: Client-side validation before API calls
- **HTTPS**: All requests use HTTPS in production

### Database Security

- **SQL Injection Prevention**: Parameterized queries
- **User Isolation**: Users can only access their own files
- **Cascading Deletes**: Files deleted when user is deleted

---

## 📊 Deployment

### Frontend Deployment (AWS S3 + CloudFront)

```bash
# Build production bundle
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete
```

**Current Frontend URL**: http://cloudstorage-frontend-suren.s3-website.ap-south-1.amazonaws.com/login

### Backend Deployment (AWS EC2)

1. Launch EC2 instance
2. Install Node.js v16+
3. Clone repository and configure .env
4. Run: `npm install && npm start`

**Current Backend URL**: http://65.0.89.9:5000/api

---

## 🐛 Troubleshooting

### "S3 error: Access Denied"
Check AWS credentials in `.env`. Ensure IAM user has proper S3 permissions.

### "Database connection failed"
Verify `DB_URL` in `.env`. Test with: `psql postgresql://user:password@host:5432/cloudvault`

### "401 Unauthorized" on file operations
Token may be expired. Log out and log back in to get a fresh token.

---

## 📱 Mobile Responsiveness

The app is fully responsive with breakpoints for:
- **Desktop**: 1024px+ (full layout)
- **Tablet**: 768px - 1024px (compact layout)
- **Mobile**: < 768px (optimized for small screens)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

**Surendar Nayak Rathod**  
GitHub: [@surendranr-3](https://github.com/surendranr-3)

---

**Status**: ✅ Production Ready  
**Last Updated**: May 2026
