#!/usr/bin/env node
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

console.log('\n🔍 LANARI API DIAGNOSTIC TEST\n');
console.log('=====================================\n');

// Check credentials are loaded
console.log('✓ Checking credentials loaded:');
console.log('  API_KEY:', process.env.LANARI_API_KEY ? '✅ Loaded' : '❌ MISSING');
console.log('  API_SECRET:', process.env.LANARI_API_SECRET ? '✅ Loaded' : '❌ MISSING');
console.log('  API_URL:', process.env.LANARI_API_URL || 'N/A');

const apiKey = process.env.LANARI_API_KEY;
const apiSecret = process.env.LANARI_API_SECRET;
const apiUrl = process.env.LANARI_API_URL;

if (!apiKey || !apiSecret) {
  console.error('\n❌ ERROR: Credentials not loaded!');
  process.exit(1);
}

console.log('\n✓ Credential lengths:');
console.log('  API_KEY length:', apiKey.length);
console.log('  API_SECRET length:', apiSecret.length);

// Test payload
const testPayload = {
  api_key: apiKey,
  api_secret: apiSecret,
  amount: 1000,
  customer_phone: '250788123456',
  currency: '',
  description: 'Test payment',
  reference_id: `TEST-${Date.now()}`
};

console.log('\n✓ Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));

// Test different authentication methods
console.log('\n=====================================');
console.log('🧪 TESTING LANARI API AUTHENTICATION');
console.log('=====================================\n');

// Method 1: Direct POST with api_key and api_secret in body
async function testMethod1() {
  console.log('📍 Method 1: Credentials in JSON body');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('  Status:', response.status);
    const text = await response.text();
    console.log('  Response:', text);
    
    if (response.status === 401) {
      console.log('  ⚠️  401 Unauthorized - Credentials may be invalid or format wrong\n');
    } else if (response.ok) {
      console.log('  ✅ Success!\n');
    } else {
      console.log('  ⚠️  Status:', response.status, '\n');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
  }
}

// Method 2: With Authorization header (Bearer token)
async function testMethod2() {
  console.log('📍 Method 2: Credentials in Authorization header (Bearer)');
  try {
    // Create a token from credentials
    const token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: testPayload.amount,
        customer_phone: testPayload.customer_phone,
        currency: testPayload.currency,
        description: testPayload.description,
        reference_id: testPayload.reference_id
      })
    });

    console.log('  Status:', response.status);
    const text = await response.text();
    console.log('  Response:', text.substring(0, 200));
    
    if (response.ok) {
      console.log('  ✅ Success!\n');
    } else {
      console.log('  ⚠️  Status:', response.status, '\n');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
  }
}

// Method 3: With Basic Auth
async function testMethod3() {
  console.log('📍 Method 3: Basic Authentication');
  try {
    const token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${token}`
      },
      body: JSON.stringify({
        amount: testPayload.amount,
        customer_phone: testPayload.customer_phone,
        currency: testPayload.currency,
        description: testPayload.description,
        reference_id: testPayload.reference_id
      })
    });

    console.log('  Status:', response.status);
    const text = await response.text();
    console.log('  Response:', text.substring(0, 200));
    
    if (response.ok) {
      console.log('  ✅ Success!\n');
    } else {
      console.log('  ⚠️  Status:', response.status, '\n');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
  }
}

// Method 4: With MD5 signature (common for payment APIs)
async function testMethod4() {
  console.log('📍 Method 4: Credentials with MD5 signature');
  try {
    // Create MD5 signature from credentials
    const signatureString = `${apiKey}${apiSecret}`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Signature': signature,
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        amount: testPayload.amount,
        customer_phone: testPayload.customer_phone,
        currency: testPayload.currency,
        description: testPayload.description,
        reference_id: testPayload.reference_id
      })
    });

    console.log('  Status:', response.status);
    const text = await response.text();
    console.log('  Response:', text.substring(0, 200));
    
    if (response.ok) {
      console.log('  ✅ Success!\n');
    } else {
      console.log('  ⚠️  Status:', response.status, '\n');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
  }
}

// Run all tests
async function runTests() {
  await testMethod1();
  await testMethod2();
  await testMethod3();
  await testMethod4();
  
  console.log('=====================================');
  console.log('📝 RECOMMENDATIONS:');
  console.log('=====================================\n');
  console.log('If you see 401 errors in all methods:');
  console.log('1. Verify API credentials are correct');
  console.log('2. Check if credentials are active in Lanari dashboard');
  console.log('3. Verify the API endpoint URL');
  console.log('4. Contact Lanari support for authentication method');
  console.log('5. Check if there are IP whitelist restrictions\n');
}

runTests().catch(console.error);
