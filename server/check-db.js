import db from './src/config/database.js';

(async () => {
  try {
    console.log('\n=== CHECKING DATABASE ===\n');
    
    // Get allocations
    console.log('📍 ALLOCATIONS:');
    const [allocations] = await db.query('SELECT allocation_id, seller_id, status FROM space_allocations LIMIT 10');
    if (allocations.length === 0) {
      console.log('No allocations found!');
    } else {
      console.table(allocations);
    }
    
    // Get sellers
    console.log('\n👤 SELLERS:');
    const [sellers] = await db.query('SELECT user_id, username, user_type FROM users WHERE user_type = ? LIMIT 10', ['seller']);
    if (sellers.length === 0) {
      console.log('No sellers found!');
    } else {
      console.table(sellers);
    }
    
    // Test specific allocation from log (allocation_id=3, seller_id=1)
    console.log('\n🔍 CHECKING ALLOCATION 3:');
    const [test] = await db.query('SELECT * FROM space_allocations WHERE allocation_id = 3 AND seller_id = 1');
    if (test.length === 0) {
      console.log('❌ Allocation 3 with seller_id 1 NOT FOUND');
    } else {
      console.table(test);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
