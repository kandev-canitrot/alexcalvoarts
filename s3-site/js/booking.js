// booking.js - Client-side booking flow handler

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the booking form page
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    // Get class level and payment type from sessionStorage (passed from index.html)
    const classLevel = sessionStorage.getItem('classLevel');
    const paymentType = sessionStorage.getItem('paymentType');
    
    // Populate hidden fields
    document.getElementById('classLevel').value = classLevel;
    document.getElementById('paymentType').value = paymentType;
    
    // Handle form submission
    bookingForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Show loading state with spinner
      const submitButton = bookingForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.innerHTML = '<div class="button-content">Processing...<span class="spinner"></span></div>';
      submitButton.disabled = true;
      
      // Get form data
      const formData = {
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        classLevel: document.getElementById('classLevel').value,
        paymentType: document.getElementById('paymentType').value
      };
      
      try {
        console.log('Submitting form data:', formData);
        
        // Step 1: Submit form data to storeBooking Lambda
        console.log('Fetching from storeBooking API...');
        const storeResponse = await fetch('https://6oekksv458.execute-api.us-east-1.amazonaws.com/storeBooking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify(formData)
        });
        
        console.log('Store response status:', storeResponse.status);
        const storeData = await storeResponse.json();
        console.log('Store response data:', storeData);
        
        if (!storeData.bookingId) {
          throw new Error('Failed to store booking information');
        }
        
        // Step 2: Create Stripe checkout session with the booking ID
        const stripeResponse = await fetch('https://n8tmpbfqqd.execute-api.us-east-1.amazonaws.com/default/createCheckoutSession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookingId: storeData.bookingId
          })
        });
        
        const stripeData = await stripeResponse.json();
        
        if (stripeData.url) {
          // Redirect to Stripe checkout
          window.location.href = stripeData.url;
        } else {
          throw new Error('Failed to create Stripe checkout session');
        }
        
      } catch (error) {
        // Reset button state to original
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
        
        // Show detailed error
        console.error('Booking error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          error
        });
        
        // Show error to user
        alert('Error: ' + error.message + '\nPlease check the browser console for more details.');
      }
    });
  }
});