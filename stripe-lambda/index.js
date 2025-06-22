const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Belly Dance or Theater Class',
          },
          unit_amount: 1500, // €15.00 in cents
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
