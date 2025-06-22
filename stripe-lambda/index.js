const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Parse the request body if it exists
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    // Default values
    let amount = 11000; // €110.00 in cents (full term)
    let productName = 'Belly Dance Class - Full Term';
    
    // Check if payment type is specified
    if (requestBody.paymentType === 'deposit') {
      amount = 5000; // €50.00 in cents (deposit)
      productName = 'Belly Dance Class - Deposit';
    } else if (requestBody.paymentType === 'full') {
      amount = 11000; // €110.00 in cents (full term)
      productName = 'Belly Dance Class - Full Term';
    }
    
    // Check if class level is specified
    if (requestBody.classLevel === 'beginner') {
      productName = 'Beginner ' + productName;
    } else if (requestBody.classLevel === 'intermediate') {
      productName = 'Intermediate ' + productName;
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: 'https://alexcalvoarts.com/thank-you.html',
      cancel_url: 'https://alexcalvoarts.com/booking.html',
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ error: 'Failed to create checkout session.' }),
    };
  }
};
