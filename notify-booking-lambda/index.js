const AWS = require('aws-sdk');
const sns = new AWS.SNS();

const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:707435095676:NewAlexCalvoArtsBookingNotification'; 

exports.handler = async (event) => {
  console.log('Received DynamoDB stream event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const newBooking = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

      const message = `
🎭 New Booking Received

Name: ${newBooking.name} ${newBooking.surname}
Email: ${newBooking.email}
Course: ${newBooking.courseBooking}
Payment type: ${newBooking.paymentType || 'n/a'}
Booking ID: ${newBooking.bookingId}
Notes: ${newBooking.notes || 'none'}
      `;

      try {
        const response = await sns.publish({
          TopicArn: SNS_TOPIC_ARN,
          Subject: '📬 New Course Booking Alert',
          Message: message
        }).promise();

        console.log('SNS publish result:', response);
      } catch (err) {
        console.error('Error publishing to SNS:', err);
      }
    }
  }

  return { statusCode: 200, body: 'Processing complete.' };
};
