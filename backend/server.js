const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');        // ← add this

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);                   // ← add this

// S3 test (you can remove this now)
const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const s3 = require('./s3');
s3.send(new ListBucketsCommand({}))
  .then(data => console.log('✅ S3 connected! Buckets:', data.Buckets.map(b => b.Name)))
  .catch(err => console.error('❌ S3 error:', err.message));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});