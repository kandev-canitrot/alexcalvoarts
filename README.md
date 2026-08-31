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
  - `AlexCalvoArtsAboutMe.html`: About page with Alexandra's biography and background
  - **Belly Dance Pages**:
    - `AlexCalvoArtsBellyDance.html`: Displays a single open-level belly dance class with booking options
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
- Determines product name based on class level (`open-level` belly dance, or theater)
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
  - Belly Dance (Open Level):
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
│   ├── AlexCalvoArtsAboutMe.html       # About Alexandra page
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

## 🗂️ Intentionally Orphaned Features

The following backend capabilities are **retained in the codebase but no longer exposed in the user-facing UI**. They have been preserved deliberately so they can be re-activated in the future without requiring new backend work.

### Separate Beginner / Intermediate Belly Dance Classes

**What was changed (March 2026):** `AlexCalvoArtsBellyDance.html` previously displayed two side-by-side booking sections — one for Beginner (Thursdays 7:00–8:00 PM) and one for Intermediate (Thursdays 8:00–9:00 PM). These have been merged into a single **Open Level Bellydance Classes** section (Thursdays 7:30–8:30 PM).

**What is orphaned:**
- The `classLevel` values `"beginner"` and `"intermediate"` are no longer submitted from the UI, but the backend fully supports them:
  - `lambda-store-booking/index.js`: still contains product-name logic for `beginner` and `intermediate` class levels (with an inline comment explaining this).
  - `lambda-stripe/index.js`: the pricing and success/cancel URL logic applies to all non-`theater` class levels, including `beginner` and `intermediate`.
- The original image for the Intermediate section (`belly-dance-pic-03.jpg`) is retained in the S3 bucket but is no longer referenced from the belly dance page.

**How to re-activate:** To restore separate Beginner and Intermediate sections, reintroduce the two-column `class-section` blocks in `AlexCalvoArtsBellyDance.html` with `data-class-level="beginner"` and `data-class-level="intermediate"` respectively. No Lambda or DynamoDB changes are required.

---

## 🔄 Workflow

1. **Service Selection**:
   - User visits the main website and selects an offering (Belly Dance or Spanish Theater)
   - User is directed to the specific offering page

2. **Class Selection**:
   - For Belly Dance: User sees the single Open Level class and selects a payment option
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
   - Booking ID is sent to `createCheckoutSession` Lambda
   - Lambda retrieves booking details from DynamoDB
   - Creates a Stripe checkout session with appropriate amount based on offering type and payment option
   - Updates DynamoDB record with Stripe session ID
   - Returns Stripe checkout URL specific to the offering type

7. **Stripe Checkout**:
   - User is redirected to Stripe's secure checkout page
   - User enters payment details and completes payment
   - Stripe redirects to the appropriate thank-you page based on offering type

8. **Payment Confirmation**:
   - Stripe sends a webhook event to `stripeWebhookHandler` Lambda
   - Lambda verifies the webhook signature
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

## 🚀 Deployment & Update Instructions

### Updating the S3 Static Site

To update the static website files in the S3 bucket, use the following AWS CLI commands:

#### Upload Individual Files
```bash
# Upload a specific HTML file
cd C:\Users\ivanc\Documents\alexcalvoarts\
aws --profile alexcalvoarts s3 cp s3-site/AlexCalvoArtsBellyDance.html s3://alexcalvoarts.com/ --content-type "text/html"
aws --profile alexcalvoarts s3 cp s3-site/AlexCalvoArtsTheaterSpanish.html s3://alexcalvoarts.com/ --content-type "text/html"

# Upload JavaScript files
aws --profile alexcalvoarts s3 cp s3-site/js/booking.js s3://alexcalvoarts.com/js/

# Upload with specific content type (if needed)
aws --profile alexcalvoarts s3 cp s3-site/index.html s3://alexcalvoarts.com/ --content-type "text/html"
```

#### Sync Entire Directory
```bash
# Sync the entire s3-site directory to S3 bucket
aws s3 sync s3-site/ s3://alexcalvoarts.com/

# Sync with delete option (removes files not present locally)
aws s3 sync s3-site/ s3://alexcalvoarts.com/ --delete

# Sync with cache control headers for better performance
aws s3 sync s3-site/ s3://alexcalvoarts.com/ --cache-control "max-age=3600"
```

#### Invalidate CloudFront Cache
After uploading new files, invalidate the CloudFront cache to ensure changes are immediately visible.

> ⚠️ **Windows / Git Bash:** single-file path invalidations (e.g. `--paths "/AlexCalvoArtsBellyDance.html"`) fail with `InvalidArgument` in Git Bash due to path mangling. Always use `"/*"` to invalidate everything, or prefix with `MSYS_NO_PATHCONV=1`.

```powershell
# Invalidate all files (distribution ID: E35E39UNP1MBJC)
aws --profile alexcalvoarts cloudfront create-invalidation `
    --distribution-id E35E39UNP1MBJC `
    --paths "/*"
```

> CloudFront invalidation only applies to **S3 static files** (HTML, JS, CSS, images). Lambda function updates take effect immediately without any invalidation.

### Updating Lambda Functions

#### ⚠️ Windows / Git Bash notes

- **`zip` is not available in Git Bash on Windows.** Use PowerShell's `Compress-Archive` instead (see commands below).
- **`Compress-Archive -Path .` zips the folder itself, not its contents**, causing Lambda to fail with `Cannot find module 'index'`. Always pass an explicit list of files/folders using `-Path @(...)`.
- **AWS CLI paths starting with `/` are mangled by Git Bash** (e.g. `/aws/lambda/...` becomes `C:/Program Files/Git/aws/lambda/...`). Prefix any such command with `MSYS_NO_PATHCONV=1` to prevent this.

#### Lambda function names (actual AWS names)

| Local directory | AWS function name |
|---|---|
| `lambda-store-booking` | `storeBooking` |
| `lambda-stripe` | `createCheckoutSession` |
| `lambda-webhook` | `stripeWebhookHandler` |
| `lambda-notify-booking` | `NewAlexCalvoArtsBookingNotification` |

#### Deploy a Lambda function (PowerShell / Windows)

```powershell
# 1. Zip the contents (NOT the folder) — run from the project root
cd C:\Users\ivanc\Documents\alexcalvoarts\lambda-store-booking
powershell Compress-Archive -Path @('index.js','node_modules','package.json','package-lock.json') -DestinationPath ../store-booking-lambda.zip -Force
cd ..

# 2. Upload to AWS
aws lambda update-function-code `
    --function-name storeBooking `
    --zip-file fileb://store-booking-lambda.zip `
    --region us-east-1 `
    --profile alexcalvoarts
```

Repeat for other functions, substituting directory, file list, zip name, and AWS function name accordingly:

| Local directory | AWS function name | Zip name |
|---|---|---|
| `lambda-store-booking` | `storeBooking` | `store-booking-lambda.zip` |
| `lambda-stripe` | `createCheckoutSession` | `stripe-lambda.zip` |
| `lambda-webhook` | `stripeWebhookHandler` | `webhook-lambda.zip` |
| `lambda-notify-booking` | `NewAlexCalvoArtsBookingNotification` | `notify-booking-lambda.zip` |

#### Environment Variables

The `createCheckoutSession` Lambda has two Stripe keys and no other variables:

```powershell
aws lambda update-function-configuration `
    --function-name createCheckoutSession `
    --region us-east-1 `
    --profile alexcalvoarts `
    --environment "Variables={STRIPE_SECRET_KEY_ALEX=sk_live_...,STRIPE_SECRET_KEY_IVAN=sk_live_...}"
```

> To read current values before changing them:
> ```powershell
> aws lambda get-function-configuration --function-name createCheckoutSession --region us-east-1 --profile alexcalvoarts --query 'Environment'
> ```

#### Testing Lambda Functions

After deployment, verify the function updated correctly:

```powershell
aws lambda get-function-configuration `
    --function-name storeBooking `
    --region us-east-1 `
    --profile alexcalvoarts `
    --query "LastUpdateStatus"
```
Should return `"Successful"`. If still `"InProgress"`, wait a few seconds and retry.

### Git Update
```bash
git add -A
git commit -m "<message>"
git push origin main
```

#### GitHub Authentication (Personal Access Token)

- `git push` uses HTTPS with a GitHub Personal Access Token (PAT), cached locally by Git Credential Manager (`credential.helper = manager`). Once a token is entered successfully, subsequent pushes work silently with no further prompts — until the token expires or is revoked.
- **The current PAT is stored in the NordPass account** — retrieve it from there when a new one is needed. Do not store the token in this repo or in any file.
- If `git push` fails with `Invalid username or token. Password authentication is not supported for Git operations.`, the cached PAT has expired or been revoked. Fix:
  1. Generate a new token on GitHub: Settings → Developer settings → Personal access tokens (classic or fine-grained) → grant repo/contents read-write access → set an expiration.
  2. Save the new token in NordPass, replacing the old one.
  3. Run `git push origin main` again; when prompted, enter your GitHub username and the new token as the password. Git Credential Manager will cache it for future pushes.
- ⚠️ Never paste a PAT directly into a chat/AI session — treat any token that was pasted as compromised and revoke/regenerate it immediately, since chat transcripts can persist beyond the session.

### Pre-deployment Checklist

Before updating production:

- [ ] Deploy updated HTML files to S3
- [ ] Deploy updated Lambda functions using `Compress-Archive` with explicit file list (see Lambda deploy section)
- [ ] Verify Lambda update status is `"Successful"` before testing
- [ ] Invalidate CloudFront cache with `"/*"` after S3 changes
- [ ] Switch `createCheckoutSession` Lambda to Stripe test key (`sk_test_...`) before running payment tests
- [ ] Test the complete booking flow end-to-end (all three payment types: full, deposit, completion)
- [ ] Verify DynamoDB records show correct `classLevel`, `courseBooking`, and `paymentType`
- [ ] Revert `createCheckoutSession` Lambda back to live Stripe key (`sk_live_...`) after testing
- [ ] Confirm live key is restored before merging to GitHub

> ⚠️ **Stripe test mode and webhooks:** when testing with a Stripe test key, `paymentStatus` in DynamoDB will remain `pending` after payment. This is expected — the webhook is configured on the live Stripe account and will not fire during test mode. It does not indicate a problem with the booking or payment flow.

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
