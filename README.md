
# Alex Calvo Arts – Static Website with Stripe Integration

This project hosts a static website for booking one-off dance and theatre classes using AWS infrastructure and Stripe Checkout. It uses S3, CloudFront, Lambda, API Gateway, and Route 53, with a focus on simplicity and cost-efficiency.

## 🏗️ Architecture Overview

Browser
|
| HTTPS
v
CloudFront (CDN) - alexcalvoarts.com / www.alexcalvoarts.com
|
| -- S3 Bucket (Static Site): alexcalvoarts.com
| -- S3 Bucket (Redirect): www.alexcalvoarts.com -> alexcalvoarts.com
|
| -- API Gateway (HTTPS POST to /createCheckoutSession)
|
| -- AWS Lambda (Stripe Checkout session creator)


## 🔧 Components

### 1. Static Website (HTML/CSS/JS)

- Hosted in an S3 bucket (`alexcalvoarts.com`)
- Delivered via CloudFront using custom domain `alexcalvoarts.com`
- Configured with a Route 53 A-record alias to CloudFront

### 2. Redirect from www to apex domain

- Second S3 bucket: `www.alexcalvoarts.com`
- Configured for static website redirect to `https://alexcalvoarts.com`
- Delivered via separate CloudFront distribution
- Mapped with a Route 53 alias (`www.alexcalvoarts.com → CloudFront`)

### 3. Stripe Integration

- Implemented using:
  - AWS Lambda (`createCheckoutSession`) written in Node.js
  - Stripe SDK included via `npm install stripe`
  - API Gateway (HTTP API) to expose the Lambda via POST
- Stripe secret key securely stored in Lambda environment variables
- Frontend uses a button to trigger `fetch()` to `/createCheckoutSession`

### 4. CORS Configuration

- CORS explicitly configured in API Gateway:
  - Access-Control-Allow-Origin: `https://alexcalvoarts.com`
  - Access-Control-Allow-Methods: `POST, OPTIONS`
  - Access-Control-Allow-Headers: `*`

### 5. SSL/TLS Certificate

- Single ACM certificate (N. Virginia `us-east-1`) covers:
  - `alexcalvoarts.com`
  - `www.alexcalvoarts.com`
- Used in both CloudFront distributions for HTTPS

## 📁 Project Structure (Local)

project-root/
├── stripe-lambda/
│ ├── index.js # Lambda handler
│ ├── package.json
│ ├── package-lock.json
│ └── node_modules/ # Stripe dependency
└── s3-site/
└── index.html # Main static website


## ✅ Deployment Summary

| Component           | Region        | Details                                  |
|--------------------|---------------|------------------------------------------|
| S3 Buckets         | eu-west-1     | Website and www redirect                 |
| Lambda + API GW    | us-east-1     | Required for ACM/CloudFront/API setup    |
| ACM Certificate    | us-east-1     | Covers both domains for HTTPS            |
| Route 53 Records   | Global        | A – Alias records for both domains       |
| Stripe Integration | Global        | Using Checkout session via Lambda        |

## 🔒 Security Notes

- No user login required
- Payment via secure Stripe Checkout session
- HTTPS enforced everywhere
- CORS restricted to `https://alexcalvoarts.com`
- Lambda keys not exposed to frontend
