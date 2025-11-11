import fetch from 'node-fetch';

// Test the Lanari payment endpoint
async function testLanariPayment() {
  try {
    console.log('🚀 Testing Lanari Payment Endpoint\n');
    
    // Generate JWT token (you may need to use a valid token from your auth system)
    // For testing, we'll make the request without auth first
    
    const testPayload = {
      allocation_id: 3,
      seller_id: 3,  // Changed from 1 to 3 (actual seller)
      amount: 1000,
      customer_phone: "0790989830",
      payment_period_start: "2024-01-01",
      payment_period_end: "2024-01-31",
      notes: "Test payment via Lanari"
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n');

    const response = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6Imt3aXplcmlpbWFuYSIsInVzZXJfdHlwZSI6InNlbGxlciIsImlhdCI6MTczMDAwMDAwMH0.test'
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
    } else {
      console.log('\n❌ Payment processing failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLanariPayment();
