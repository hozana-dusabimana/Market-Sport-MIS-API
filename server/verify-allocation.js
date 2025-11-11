import db from './src/config/database.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database for Valid Allocations and Sellers\n');

    // Get all allocations
    const [allocations] = await db.query(
      'SELECT allocation_id, seller_id, space_id, status FROM space_allocations LIMIT 10'
    );

    console.log('📊 ALLOCATIONS:');
    console.table(allocations);
    console.log('\n');

    // Get all sellers
    const [sellers] = await db.query(
      'SELECT user_id, username, user_type FROM users WHERE user_type = "seller" LIMIT 10'
    );

    console.log('👥 SELLERS:');
    console.table(sellers);
    console.log('\n');

    // Check allocation 3
    const [alloc3] = await db.query(
      'SELECT * FROM space_allocations WHERE allocation_id = 3'
    );

    if (alloc3 && alloc3.length > 0) {
      console.log('📋 ALLOCATION #3 DETAILS:');
      console.log(JSON.stringify(alloc3[0], null, 2));
      console.log('\nSeller ID in allocation:', alloc3[0].seller_id);
      
      // Check if seller exists
      const [sellerCheck] = await db.query(
        'SELECT * FROM users WHERE user_id = ?',
        [alloc3[0].seller_id]
      );
      
      if (sellerCheck && sellerCheck.length > 0) {
        console.log('✅ Seller exists:', sellerCheck[0].username);
        console.log('   User Type:', sellerCheck[0].user_type);
      } else {
        console.log('❌ Seller NOT found');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
