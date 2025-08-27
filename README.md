# Alex Calvo Arts – Multi-Service Booking System

This project implements a complete booking system for Alexandra's multiple offerings (belly dance classes and Spanish theater classes) using AWS serverless architecture and Stripe payment processing. It uses S3, CloudFront, Lambda, API Gateway, DynamoDB, and Route 53, with a focus on simplicity, cost-efficiency, and secure payment processing.

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
  - `index.html`: Main landing page with links to different offerings
  - **Belly Dance Pages**:
    - `AlexCalvoArtsBellyDance.html`: Displays belly dance classes with booking options
    - `belly-dance-booking-form.html`: Collects customer information for belly dance bookings
    - `belly-dance-thank-you.html`: Confirmation page after successful belly dance payment
  - **Spanish Theater Pages**:
    - `AlexCalvoArtsTheaterSpanish.html`: Displays Spanish theater classes with booking options
    - `theater-booking-form.html`: Collects customer information for theater bookings
    - `theater-spanish-thank-you.html`: Confirmation page after successful theater payment
- **JavaScript**:
  - `booking.js`: Handles the booking flow and API interactions for all offerings
- **UI Features**:
  - Loading animations for all buttons during processing
  - Responsive design for mobile and desktop
  - Distinct visual styling for each offering (purple theme for belly dance, green theme for Spanish theater)
- **Hosting**:
  - S3 bucket (`alexcalvoarts.com`) for static content
  - CloudFront distribution for content delivery with HTTPS
  - Route 53 for DNS management

### 2. Lambda Functions

#### a. Store Booking Lambda (`store-booking-lambda`)
- Creates a new booking record in DynamoDB
- Validates user input and generates a unique booking ID
- Determines product name based on class level (belly dance beginner/intermediate or theater)
- Returns the booking ID for the next step in the process

#### b. Stripe Lambda (`stripe-lambda`)
- Creates a Stripe checkout session for payment processing
- Retrieves booking details from DynamoDB using the booking ID
- Sets the appropriate amount based on offering type and payment type:
  - Belly Dance: €110 for full term, €50 for deposit, €60 for completion
  - Spanish Theater: €120 for full term, €20 for deposit, €100 for completion
- Updates the booking record with the Stripe session ID
- Returns the Stripe checkout URL for redirection with offering-specific success URLs

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
  - Booking Details: courseBooking, classLevel (beginner/intermediate/theater), paymentType (full/deposit/completion)
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
  - Belly Dance:
    - Full term payment (€110)
    - Deposit payment (€50)
    - Completion payment (€60) - for users who paid deposit and want to complete full term
  - Spanish Theater:
    - Full term payment (€120)
    - Deposit payment (€20)
    - Completion payment (€100) - for users who paid deposit and want to complete full term
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
│   ├── index.html                # Main landing page
│   ├── AlexCalvoArtsBellyDance.html    # Belly dance classes page
│   ├── belly-dance-booking-form.html   # Belly dance booking form
│   ├── belly-dance-thank-you.html      # Belly dance success page
│   ├── AlexCalvoArtsTheaterSpanish.html # Spanish theater classes page
│   ├── theater-booking-form.html       # Theater booking form
│   ├── theater-spanish-thank-you.html  # Theater success page
│   └── js/
│       └── booking.js            # Client-side booking logic
│
├── lambda-store-booking/         # Lambda for storing booking data
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── lambda-stripe/                # Lambda for Stripe checkout
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── lambda-webhook/               # Lambda for Stripe webhooks
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
├── lambda-notify-booking/        # Lambda for booking notifications
│   ├── index.js                  # Lambda handler
│   ├── package.json
│   └── package-lock.json
│
└── README.md                     # Project documentation
```

## 🔄 Workflow

1. **Service Selection**:
   - User visits the main website and selects an offering (Belly Dance or Spanish Theater)
   - User is directed to the specific offering page

2. **Class Selection**:
   - For Belly Dance: User selects a class level (Beginner or Intermediate)
   - For Spanish Theater: User views the available theater class
   - User chooses payment option:
     - Belly Dance: Full term €110, Deposit €50, or Completion €60
     - Spanish Theater: Full term €120, Deposit €20, or Completion €100
     - Completion option is for users who already paid a deposit and want to complete the full term
   - Selection is stored in browser's sessionStorage
   - Loading animation appears on button during processing

3. **Customer Information**:
   - User is redirected to the appropriate booking form (belly dance or theater)
   - User enters personal details (name, surname, email, phone)
   - Form data and class selection are submitted to the store-booking-lambda
   - Loading animation appears on submit button during processing

4. **Booking Creation**:
   - store-booking-lambda validates the input data
   - Determines the appropriate product name based on class level and offering type
   - Creates a new record in DynamoDB with status "pending"
   - Returns a unique booking ID
   - DynamoDB stream triggers notify-booking-lambda

5. **Notification**:
   - notify-booking-lambda formats the booking information
   - Sends a notification to the SNS topic
   - Administrators receive real-time alerts about the new booking

6. **Payment Processing**:
   - Booking ID is sent to stripe-lambda
   - stripe-lambda retrieves booking details from DynamoDB
   - Creates a Stripe checkout session with appropriate amount based on offering type and payment option
   - Updates DynamoDB record with Stripe session ID
   - Returns Stripe checkout URL specific to the offering type

7. **Stripe Checkout**:
   - User is redirected to Stripe's secure checkout page
   - User enters payment details and completes payment
   - Stripe redirects to the appropriate thank-you page based on offering type

8. **Payment Confirmation**:
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

### Multiple Offerings with Distinct Styling

- Each offering has its own visual identity:
  - Belly Dance: Purple theme with gold accents and elegant typography
  - Spanish Theater: Green and orange theme with clean, modern typography
- Responsive design adapts to different screen sizes
- Consistent branding within each offering's page flow

### Loading Animations

- All buttons feature loading animations during processing to provide visual feedback
- Spinner animation appears next to "Processing..." text when a button is clicked
- Prevents the perception that the page is frozen during API calls
- Improves user experience by indicating that the system is working
- Implemented using CSS animations for smooth performance
- Consistent design across all pages (landing pages and booking forms)
