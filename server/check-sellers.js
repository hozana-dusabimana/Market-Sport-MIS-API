import db from './src/config/database.js';

async function checkSellers() {
  try {
    console.log('🔍 Checking Sellers Table\n');

    // Get all sellers
    const [sellers] = await db.query(
      'SELECT * FROM sellers LIMIT 10'
    );

    console.log('👥 SELLERS TABLE:');
    console.table(sellers);
    console.log('\n');

    // Check foreign key constraint
    const [constraints] = await db.query(
      'SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = "space_allocations"'
    );

    console.log('🔗 FOREIGN KEY CONSTRAINTS:');
    console.table(constraints);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSellers();
