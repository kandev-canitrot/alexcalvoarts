# Alex Calvo Arts – Dance Class Booking System

This project implements a complete booking system for Alexandra's belly dance classes using AWS serverless architecture and Stripe payment processing. It uses S3, CloudFront, Lambda, API Gateway, DynamoDB, and Route 53, with a focus on simplicity, cost-efficiency, and secure payment processing.

## 🏗️ Architecture Overview

```
                                   ┌─────────────────┐
                                   │                 │
                                   │  S3 Static Site │
                                   │                 │
                                   └────────┬────────┘
                                            │
                                            │ HTTPS
                                            │
                                   ┌────────▼────────┐
Browser ─────────────────────────►│    CloudFront   │◄────── Route 53 DNS
                                   └────────┬────────┘
                                            │
                                            │ HTTPS
                                            │
                  ┌───────────────┬─────────┴────────┬───────────────┐
                  │               │                  │               │
         ┌────────▼─────┐ ┌──────▼───────┐  ┌───────▼────────┐ ┌────▼─────────┐
         │ API Gateway  │ │ API Gateway  │  │  API Gateway   │ │ API Gateway  │
         │ (Booking API)│ │ (Stripe API) │  │ (Webhook API)  │ │ (Other APIs) │
         └────────┬─────┘ └──────┬───────┘  └───────┬────────┘ └──────────────┘
                  │               │                  │
                  │               │                  │
         ┌────────▼─────┐ ┌──────▼───────┐  ┌───────▼────────┐
         │    Lambda    │ │    Lambda    │  │     Lambda     │
         │ store-booking│ │    stripe    │  │    webhook     │
         └────────┬─────┘ └──────┬───────┘  └───────┬────────┘
                  │               │                  │
                  │               │                  │
                  └───────┬───────┘                  │
                          │                          │
                  ┌───────▼──────────────────────────▼────┐
                  │                                       │
                  │            DynamoDB Table             │
                  │      AlexCalvoArtsDanceBookings       │──────┐
                  │                                       │      │
                  └───────────────────┬──────────────────┘      │
                                      │                         │
                                      │                         │
                            ┌─────────▼──────────┐     ┌────────▼────────┐
                            │                    │     │                 │
                            │   Stripe Payment   │     │ Notify Lambda   │
                            │      Platform      │     │                 │
                            │                    │     └────────┬────────┘
                            └────────────────────┘              │
                                                                │
                                                       ┌────────▼────────┐
                                                       │                 │
                                                       │    SNS Topic    │
                                                       │                 │
                                                       └────────┬────────┘
                                                                │
                                                                │
                                                       ┌────────▼────────┐
                                                       │                 │
                                                       │ Email/SMS/etc.  │
                                                       │                 │
                                                       └─────────────────┘
```


## 🔧 Components

### 1. Static Website (HTML/CSS/JS)

- **Main Pages**:
  - `index.html`: Displays available dance classes with booking options
  - `booking-form.html`: Collects customer information for booking
  - `thank-you.html`: Confirmation page after successful payment
- **JavaScript**:
  - `booking.js`: Handles the booking flow and API interactions
- **UI Features**:
  - Loading animations for all buttons during processing
  - Responsive design for mobile and desktop
- **Hosting**:
  - S3 bucket (`alexcalvoarts.com`) for static content
  - CloudFront distribution for content delivery with HTTPS
  - Route 53 for DNS management

### 2. Lambda Functions

#### a. Store Booking Lambda (`store-booking-lambda`)
- Creates a new booking record in DynamoDB
- Validates user input and generates a unique booking ID
- Returns the booking ID for the next step in the process

#### b. Stripe Lambda (`stripe-lambda`)
- Creates a Stripe checkout session for payment processing
- Retrieves booking details from DynamoDB using the booking ID
- Sets the appropriate amount based on payment type (full payment or deposit)
- Updates the booking record with the Stripe session ID
- Returns the Stripe checkout URL for redirection

#### c. Webhook Lambda (`webhook-lambda`)
- Processes Stripe webhook events
- Verifies webhook signatures for security
- Updates booking payment status in DynamoDB when payment is completed

#### d. Notify Booking Lambda (`notify-booking-lambda`)
- Listens to DynamoDB stream events for new bookings
- Formats booking information into a readable message
- Publishes notifications to an SNS topic
- Enables real-time alerts for new bookings via email or SMS

### 3. Database

- **DynamoDB Table**: `AlexCalvoArtsDanceBookings`
- **Schema**:
  - Primary Key: `bookingId` (UUID)
  - Customer Information: name, surname, email, phoneNumber
  - Booking Details: courseBooking, classLevel, paymentType
  - Payment Information: paymentStatus, stripeSessionId
  - Timestamps: day, month, year, hour, min, sec
- **Streams**: Enabled to trigger the notify-booking-lambda

### 4. API Gateway

- Three separate API endpoints:
  - `/storeBooking`: Connected to store-booking-lambda
  - `/createCheckoutSession`: Connected to stripe-lambda
  - Webhook endpoint: Connected to webhook-lambda
- CORS configuration for secure cross-origin requests
- HTTP methods: POST, OPTIONS (for CORS preflight)

### 5. Stripe Integration

- Secure payment processing using Stripe Checkout
- Payment options:
  - Full term payment (€110)
  - Deposit payment (€50)
- Webhook integration for payment status updates
- Stripe secret keys stored securely in Lambda environment variables

### 6. Notification System

- **SNS Topic**: `NewAlexCalvoArtsBookingNotification`
- Real-time notifications when new bookings are created
- Formatted messages with booking details
- Configurable delivery methods (email, SMS, etc.)

## 📁 Project Structure

```
project-root/
├── s3-site/                      # Static website files
│   ├── index.html                # Main page with class listings
│   ├── booking-form.html         # Customer information form
│   ├── thank-you.html            # Success page after payment
│   └── js/
│       └── booking.js            # Client-side booking logic
│
├── store-booking-lambda/         # Lambda for storing booking data
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── stripe-lambda/                # Lambda for Stripe checkout
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── webhook-lambda/               # Lambda for Stripe webhooks
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── notify-booking-lambda/        # Lambda for booking notifications
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── update-lambdas.sh             # Script to update Lambda functions
└── README.md                     # Project documentation
```

## 🔄 Workflow

1. **Class Selection**:
   - User visits the website and selects a dance class (Beginner or Intermediate)
   - User chooses payment option (Full term €110 or Deposit €50)
   - Selection is stored in browser's sessionStorage
   - Loading animation appears on button during processing

2. **Customer Information**:
   - User is redirected to the booking form
   - User enters personal details (name, surname, email, phone)
   - Form data and class selection are submitted to the store-booking-lambda
   - Loading animation appears on submit button during processing

3. **Booking Creation**:
   - store-booking-lambda validates the input data
   - Creates a new record in DynamoDB with status "pending"
   - Returns a unique booking ID
   - DynamoDB stream triggers notify-booking-lambda

4. **Notification**:
   - notify-booking-lambda formats the booking information
   - Sends a notification to the SNS topic
   - Administrators receive real-time alerts about the new booking

5. **Payment Processing**:
   - Booking ID is sent to stripe-lambda
   - stripe-lambda retrieves booking details from DynamoDB
   - Creates a Stripe checkout session with appropriate amount
   - Updates DynamoDB record with Stripe session ID
   - Returns Stripe checkout URL

6. **Stripe Checkout**:
   - User is redirected to Stripe's secure checkout page
   - User enters payment details and completes payment
   - Stripe redirects to thank-you.html on success

7. **Payment Confirmation**:
   - Stripe sends a webhook event to webhook-lambda
   - webhook-lambda verifies the webhook signature
   - Updates the booking status to "completed" in DynamoDB

## ✅ Deployment Summary

| Component           | Region        | Details                                       |
|--------------------|---------------|-----------------------------------------------|
| S3 Buckets         | eu-west-1     | Website and www redirect                      |
| Lambda Functions   | us-east-1     | Four Lambda functions for different purposes  |
| API Gateway        | us-east-1     | Three endpoints for different operations      |
| DynamoDB           | us-east-1     | Table for storing booking information         |
| SNS Topic          | us-east-1     | For booking notifications                     |
| ACM Certificate    | us-east-1     | Covers domains for HTTPS                      |
| Route 53 Records   | Global        | DNS management                                |
| Stripe Integration | Global        | Payment processing and webhooks               |

## 🔒 Security Notes

- No user login required - simple booking flow
- Payment via secure Stripe Checkout session
- HTTPS enforced everywhere
- CORS headers properly configured for security
- Stripe webhook signature verification
- Lambda environment variables for sensitive keys
- DynamoDB for persistent and secure data storage

## 🎨 UI Enhancements

### Loading Animations

- All buttons feature loading animations during processing to provide visual feedback
- Spinner animation appears next to "Processing..." text when a button is clicked
- Prevents the perception that the page is frozen during API calls
- Improves user experience by indicating that the system is working
- Implemented using CSS animations for smooth performance
- Consistent design across all pages (landing page and booking form)
