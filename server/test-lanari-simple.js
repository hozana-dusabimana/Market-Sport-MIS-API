#!/usr/bin/env node

// Simple test script for Lanari payment endpoint
async function testPaymentEndpoint() {
  try {
    console.log('🚀 Testing Lanari Payment Endpoint\n');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6Imt3aXplcmlpbWFuYSIsInVzZXJfdHlwZSI6InNlbGxlciIsImlhdCI6MTc2Mjg4ODIxOH0.AHIV4LUhn2BQ5rxd7ZU5P-ZFrsyVw8hL3pchFyCcs-0';
    
    const payload = {
      allocation_id: 3,
      seller_id: 1,
      amount: 1000,
      customer_phone: "0790989830",
      payment_period_start: "2024-01-01",
      payment_period_end: "2024-01-31",
      notes: "Test Lanari payment"
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n');

    const response = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      timeout: 30000
    });

    const data = await response.json();

    console.log(`📥 Response Status: ${response.status}`);
    console.log('📥 Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Payment ID: ${data.data.payment_id}`);
      console.log(`   Transaction ID: ${data.data.transaction_id}`);
      console.log(`   Status: ${data.data.status}`);
    } else {
      console.log('\n❌ FAILED');
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }

  // Exit after a delay
  setTimeout(() => process.exit(0), 1000);
}

testPaymentEndpoint();
