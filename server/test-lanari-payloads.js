#!/usr/bin/env node
import dotenv from 'dotenv';
import crypto from 'crypto';
import http from 'http';
import https from 'https';

dotenv.config();

console.log('\n🔧 LANARI API ADVANCED DIAGNOSTIC\n');

const apiKey = process.env.LANARI_API_KEY;
const apiSecret = process.env.LANARI_API_SECRET;

// Test different payload structures that Lanari might expect
const testPayloads = [
  {
    name: 'Standard (current)',
    payload: {
      api_key: apiKey,
      api_secret: apiSecret,
      amount: 1000,
      customer_phone: '250788123456',
      currency: 'RWF',
      description: 'Test'
    }
  },
  {
    name: 'Without api_secret in body',
    payload: {
      api_key: apiKey,
      amount: 1000,
      customer_phone: '250788123456',
      currency: 'RWF',
      description: 'Test'
    },
    headers: {
      'X-API-Secret': apiSecret
    }
  },
  {
    name: 'URL encoded format',
    payload: `api_key=${apiKey}&api_secret=${apiSecret}&amount=1000&customer_phone=250788123456&currency=RWF&description=Test`,
    isUrlEncoded: true
  },
  {
    name: 'With timestamp (signature)',
    payload: {
      api_key: apiKey,
      amount: 1000,
      customer_phone: '250788123456',
      currency: 'RWF',
      description: 'Test',
      timestamp: Math.floor(Date.now() / 1000),
      signature: generateSignature(apiKey, apiSecret)
    }
  },
  {
    name: 'Minimal payload',
    payload: {
      api_key: apiKey,
      api_secret: apiSecret,
      msisdn: '250788123456',
      amount: 1000
    }
  }
];

function generateSignature(key, secret) {
  const combined = key + secret + Math.floor(Date.now() / 1000);
  return crypto.createHash('sha256').update(combined).digest('hex');
}

async function testPayload(index, testCase) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`${'═'.repeat(60)}`);

  const url = new URL('https://www.lanari.rw/lanari_pay/api/payment/process.php');
  
  const headers = {
    'Accept': 'application/json',
    ...testCase.headers
  };

  let body;
  if (testCase.isUrlEncoded) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = testCase.payload;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(testCase.payload);
  }

  headers['Content-Length'] = Buffer.byteLength(body);

  console.log('Headers:', headers);
  console.log('Payload:', body.substring(0, 200) + (body.length > 200 ? '...' : ''));

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: headers
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\nStatus: ${res.status || res.statusCode}`);
        console.log('Response:', data);
        
        if (res.status === 200 || res.statusCode === 200) {
          console.log('✅ SUCCESS!');
        } else if (res.status === 401 || res.statusCode === 401) {
          console.log('❌ Still 401');
        } else {
          console.log(`⚠️  Status ${res.status || res.statusCode}`);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('Error:', error.message);
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('⏱️  Request timeout');
      resolve();
    });

    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('Testing different Lanari API payload formats...\n');
  
  for (let i = 0; i < testPayloads.length; i++) {
    await testPayload(i, testPayloads[i]);
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('RESULTS SUMMARY');
  console.log(`${'═'.repeat(60)}\n`);
  console.log('If one of the tests above showed 200 or different status:');
  console.log('- That\'s the correct format');
  console.log('- Update lanariPaymentService.js to use that format\n');
  console.log('If all still 401:');
  console.log('1. Credentials are definitely wrong or inactive');
  console.log('2. Contact Lanari support');
  console.log('3. Ask for API documentation and example request\n');
}

runTests().catch(console.error);
