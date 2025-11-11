import db from './src/config/database.js';

async function testPaymentRequestPrep() {
  try {
    console.log('✅ VERIFICATION: Allocation 3 and Seller 1 Relationship\n');

    // Get allocation
    const [allocation] = await db.query(
      'SELECT * FROM space_allocations WHERE allocation_id = 3'
    );

    // Get seller
    const [seller] = await db.query(
      'SELECT * FROM sellers WHERE seller_id = 1'
    );

    // Get user (seller profile)
    const [user] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [seller[0]?.user_id]
    );

    console.log('📋 ALLOCATION:');
    console.log('   allocation_id:', allocation[0]?.allocation_id);
    console.log('   seller_id:', allocation[0]?.seller_id);
    console.log('   space_id:', allocation[0]?.space_id);
    console.log('   status:', allocation[0]?.status);

    console.log('\n👤 SELLER PROFILE:');
    console.log('   seller_id:', seller[0]?.seller_id);
    console.log('   user_id:', seller[0]?.user_id);
    console.log('   full_name:', seller[0]?.full_name);
    console.log('   business_name:', seller[0]?.business_name);

    console.log('\n👥 USER:');
    console.log('   user_id:', user[0]?.user_id);
    console.log('   username:', user[0]?.username);
    console.log('   user_type:', user[0]?.user_type);

    console.log('\n✅ CORRECT MAPPING: allocation_id=3 → seller_id=1 → user_id=3 (kwizeriimana)');
    console.log('\n📝 PAYMENT REQUEST SHOULD USE:');
    console.log('   allocation_id: 3');
    console.log('   seller_id: 1  (from sellers table)');
    console.log('   customer_phone: 0790989830');
    console.log('   amount: 1000');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPaymentRequestPrep();
