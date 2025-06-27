const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

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
    
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    console.log('Parsed request body:', JSON.stringify(requestBody));
    
    // Extract user information
    const { 
      name, 
      surname, 
      email, 
      phoneNumber, 
      classLevel, 
      paymentType 
    } = requestBody;
    
    // Validate required fields
    if (!name || !surname || !email || !phoneNumber || !classLevel || !paymentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Determine product name based on class level and payment type
    let productName = 'Belly Dance Class';
    let isFullTerm = paymentType === 'full';
    let isPreBooking = paymentType === 'deposit';
    
    if (paymentType === 'deposit') {
      productName += ' - Deposit';
    } else if (paymentType === 'full') {
      productName += ' - Full Term';
    }
    
    if (classLevel === 'beginner') {
      productName = 'Beginner ' + productName;
    } else if (classLevel === 'intermediate') {
      productName = 'Intermediate ' + productName;
    }
    
    // Generate a unique booking ID
    const bookingId = uuidv4();
    
    // Get current date and time
    const now = new Date();
    
    // Create a DynamoDB entry
    const bookingItem = {
      bookingId,
      name,
      surname,
      email,
      phoneNumber,
      courseBooking: productName,
      preBooking: isPreBooking,
      fullTerm: isFullTerm,
      day: now.getDate(),
      month: now.getMonth() + 1, // JavaScript months are 0-indexed
      year: now.getFullYear(),
      hour: now.getHours(),
      min: now.getMinutes(),
      sec: now.getSeconds(),
      paymentStatus: 'pending',
      classLevel,
      paymentType
    };
    
    // Save the booking to DynamoDB
    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: bookingItem
    }).promise();
    
    // Return the booking ID
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        bookingId: bookingId,
        message: 'Booking information stored successfully'
      })
    };
    
  } catch (error) {
    console.error('Error storing booking information:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to store booking information',
        message: error.message,
        stack: error.stack
      })
    };
  }
};