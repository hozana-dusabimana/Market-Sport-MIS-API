// Test the Lanari payment endpoint with correct data
async function testLanariPayment() {
  try {
    console.log('🚀 Testing Lanari Payment Endpoint\n');
    
    // Correct payment request data
    const testPayload = {
      allocation_id: 3,
      seller_id: 1,  // Correct seller_id from sellers table
      amount: 1000,
      customer_phone: "0790989830",
      payment_period_start: "2024-01-01",
      payment_period_end: "2024-01-31",
      notes: "Test payment via Lanari API"
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n');

    // Get a valid token - using a mock token for testing
    // In production, you would get this from the auth endpoint
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6Imt3aXplcmlpbWFuYSIsInVzZXJfdHlwZSI6InNlbGxlciIsImlhdCI6MTczMDAwMDAwMH0.test';

    const response = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log(`📥 Response Status: ${response.status}`);
    console.log('📥 Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Payment processed successfully!');
      console.log(`   Transaction ID: ${data.data.transaction_id}`);
      console.log(`   Payment ID: ${data.data.payment_id}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('\n❌ Payment processing failed');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Wait a bit for server to be ready, then test
setTimeout(testLanariPayment, 1000);
