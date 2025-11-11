import db from './src/config/database.js';

async function fixAllocation() {
  try {
    console.log('🔧 Fixing Allocation #3 - Updating seller_id from 1 to 3\n');

    // Update allocation 3
    const [result] = await db.query(
      'UPDATE space_allocations SET seller_id = 3 WHERE allocation_id = 3'
    );

    console.log('✅ Allocation updated:', result);
    console.log('\n');

    // Verify the fix
    const [allocation] = await db.query(
      'SELECT allocation_id, seller_id FROM space_allocations WHERE allocation_id = 3'
    );

    console.log('📋 VERIFICATION:');
    console.table(allocation);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllocation();
