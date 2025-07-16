const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_ALEX);

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'AlexCalvoArtsDanceBookings';

exports.handler = async (event) => {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,stripe-signature',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Access-Control-Max-Age': '86400'
  };

  // Handle preflight OPTIONS request
  if (event.requestContext?.http?.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    console.log('Received webhook event:', JSON.stringify(event, null, 2));

    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Get the raw body as a Buffer
    let rawBody;
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(event.body, 'base64');
    } else {
      rawBody = Buffer.from(event.body, 'utf8');
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }

    console.log('Verified Stripe event type:', stripeEvent.type);

    // Handle the checkout.session.completed event
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;

      // Get the booking ID from the session metadata
      const bookingId = session.metadata.bookingId;

      if (bookingId) {
        await dynamoDB.update({
          TableName: TABLE_NAME,
          Key: { bookingId },
          UpdateExpression: 'SET paymentStatus = :status',
          ExpressionAttributeValues: {
            ':status': 'completed'
          }
        }).promise();

        console.log(`Updated booking ${bookingId} status to completed`);
      } else {
        console.warn('No bookingId found in session metadata');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process webhook',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
