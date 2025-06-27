#!/bin/bash

# Define Lambda function names
STORE_BOOKING_LAMBDA="storeBooking"
STRIPE_LAMBDA="createCheckoutSession"
WEBHOOK_LAMBDA="stripeWebhookHandler"

# Define AWS region
AWS_REGION="us-east-1"

echo "Creating ZIP files..."

# Create store-booking-lambda.zip
cd store-booking-lambda
zip -r ../store-booking-lambda.zip .
cd ..
echo "Created store-booking-lambda.zip"

# Create stripe-lambda.zip
cd stripe-lambda
zip -r ../stripe-lambda.zip .
cd ..
echo "Created stripe-lambda.zip"

# Create webhook-lambda.zip
cd webhook-lambda
zip -r ../webhook-lambda.zip .
cd ..
echo "Created webhook-lambda.zip"

echo "Updating Lambda functions in region $AWS_REGION..."

# Update store-booking Lambda
aws lambda update-function-code \
  --profile kanaws-canitrot \
  --function-name $STORE_BOOKING_LAMBDA \
  --zip-file fileb://store-booking-lambda.zip \
  --region $AWS_REGION
echo "Updated $STORE_BOOKING_LAMBDA"

# Update stripe Lambda
aws lambda update-function-code \
  --profile kanaws-canitrot \
  --function-name $STRIPE_LAMBDA \
  --zip-file fileb://stripe-lambda.zip \
  --region $AWS_REGION
echo "Updated $STRIPE_LAMBDA"

# Update webhook Lambda
aws lambda update-function-code \
  --profile kanaws-canitrot \
  --function-name $WEBHOOK_LAMBDA \
  --zip-file fileb://webhook-lambda.zip \
  --region $AWS_REGION
echo "Updated $WEBHOOK_LAMBDA"

echo "All Lambda functions updated successfully!"
