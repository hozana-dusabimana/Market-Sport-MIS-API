#!/usr/bin/env node

/**
 * Test Lanari Payment Integration
 * This script tests if payments can be initiated to Lanari API
 */

import fetch from 'node-fetch';

const testLanariPayment = async () => {
  console.log('🔄 Testing Lanari Payment Integration...\n');

  try {
    // Step 1: Get auth token
    console.log('📍 Step 1: Getting authentication token...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    console.log(`✅ Got token: ${authToken.substring(0, 20)}...\n`);

    // Step 2: Process Lanari payment
    console.log('📍 Step 2: Processing Lanari payment...');
    const paymentResponse = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        allocation_id: 1,
        seller_id: 5,
        amount: 1000,
        customer_phone: '250788123456',
        payment_period_start: '2025-01-01',
        payment_period_end: '2025-01-31',
        notes: 'Test Lanari payment'
      })
    });

    const paymentData = await paymentResponse.json();
    
    if (paymentData.success) {
      console.log('✅ Payment processed successfully!\n');
      console.log('Response:', JSON.stringify(paymentData, null, 2));
    } else {
      console.log('❌ Payment failed!\n');
      console.log('Response:', JSON.stringify(paymentData, null, 2));
    }

    // Step 3: Get payment details
    if (paymentData.data?.payment_id) {
      console.log('\n📍 Step 3: Retrieving payment details...');
      const getResponse = await fetch(
        `http://localhost:3000/api/v1/payments/${paymentData.data.payment_id}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      const getPaymentData = await getResponse.json();
      console.log('✅ Payment details:\n', JSON.stringify(getPaymentData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testLanariPayment();
