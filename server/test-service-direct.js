import 'dotenv/config';
import lanariPaymentService from './src/services/lanariPaymentService.js';

async function testDirectPayment() {
  try {
    console.log('🧪 Testing Lanari payment service directly\n');

    const paymentData = {
      amount: 5,
      customer_phone: '0790989830',
      description: 'Direct Service Test',
      currency: '',
      reference_id: `DIRECT-${Date.now()}`
    };

    console.log('📤 Sending to Lanari service:');
    console.log(JSON.stringify(paymentData, null, 2));
    console.log('\n');

    const response = await lanariPaymentService.processPayment(paymentData);

    console.log('✅ Response received:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  process.exit(0);
}

testDirectPayment();
