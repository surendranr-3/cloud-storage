/**
 * AWS S3 CLIENT CONFIGURATION
 * 
 * Initializes an AWS S3 client for file storage operations.
 * This module handles all communication with Amazon S3 for:
 * - Uploading files with AES-256 server-side encryption
 * - Generating signed URLs for secure downloads
 * - Deleting files from the S3 bucket
 * 
 * Credentials loaded from environment variables:
 * - AWS_REGION: AWS region where the bucket is located
 * - AWS_ACCESS_KEY_ID: AWS programmatic access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret access key
 * - AWS_BUCKET: Bucket name (used in routes)
 */

const { S3Client } = require('@aws-sdk/client-s3');

// Initialize S3 client with AWS credentials from environment
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

module.exports = s3;