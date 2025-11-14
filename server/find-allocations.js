import db from './src/config/database.js';

async function findValidAllocations() {
  try {
    console.log('🔍 Finding valid allocations for seller_id=1\n');

    const [allocations] = await db.query(
      'SELECT allocation_id, seller_id, space_id, status FROM space_allocations WHERE seller_id = 1 AND status = "active"'
    );

    console.log('✅ Active Allocations for seller_id=1:');
    console.table(allocations);
    
    if (allocations.length === 0) {
      console.log('\n⚠️  No active allocations found for seller_id=1');
      console.log('\nListing ALL allocations:');
      const [all] = await db.query('SELECT allocation_id, seller_id, space_id, status FROM space_allocations LIMIT 10');
      console.table(all);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findValidAllocations();
