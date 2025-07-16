const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_ALEX);
const AWS = require('aws-sdk');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'AlexCalvoArtsDanceBookings';

exports.handler = async (event) => {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin',
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
    console.log('Received event:', JSON.stringify(event));
    
    // Parse the request body if it exists
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
        console.log('Parsed request body:', JSON.stringify(requestBody));
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    // Extract the booking ID
    const { bookingId } = requestBody;
    
    // Validate booking ID
    if (!bookingId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing booking ID' })
      };
    }
    
    // Retrieve the booking from DynamoDB
    const getResult = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { bookingId }
    }).promise();
    
    // Check if booking exists
    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Booking not found' })
      };
    }
    
    const booking = getResult.Item;
    
    // Default values for Belly Dance classes
    let amount = 11000; // €110.00 in cents (full term for Belly Dance)
    let productName = booking.courseBooking;
    
    // Check class level and payment type to determine amount
    if (booking.classLevel === 'theater') {
      // Theater in Spanish class pricing
      if (booking.paymentType === 'full') {
        amount = 12000; // €120.00 in cents (full term)
      } else if (booking.paymentType === 'deposit') {
        amount = 2000; // €20.00 in cents (deposit)
      }
    } else {
      // Belly Dance class pricing
      if (booking.paymentType === 'deposit') {
        amount = 5000; // €50.00 in cents (deposit)
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
            description: `${booking.name} ${booking.surname} - ${booking.email}`
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: booking.classLevel === 'theater'
        ? `https://alexcalvoarts.com/theater-spanish-thank-you.html?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`
        : `https://alexcalvoarts.com/belly-dance-thank-you.html?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: booking.classLevel === 'theater'
        ? 'https://alexcalvoarts.com/AlexCalvoArtsTheaterSpanish.html'
        : 'https://alexcalvoarts.com/AlexCalvoArtsBellyDance.html',
      customer_email: booking.email,
      metadata: {
        bookingId
      }
    });
    
    // Update the booking with the Stripe session ID
    await dynamoDB.update({
      TableName: TABLE_NAME,
      Key: { bookingId },
      UpdateExpression: 'SET stripeSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': session.id
      }
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create checkout session.',
        message: error.message,
        stack: error.stack
      }),
    };
  }
};
