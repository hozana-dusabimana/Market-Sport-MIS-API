import bcrypt from 'bcryptjs';

export async function seed(connection) {
  console.log('  → Seeding managers, sellers, allocations, payments...');

  // Reuse admin hash for convenience
  const [adminRow] = await connection.query(`SELECT password_hash FROM users WHERE username = 'admin' LIMIT 1`);
  const passwordHash = adminRow?.[0]?.password_hash || await bcrypt.hash('admin123', 10);

  // Create two manager users
  const managers = [
    { username: 'manager_a', email: 'manager_a@example.com', full_name: 'Manager A', id_number: 'MGR-A' },
    { username: 'manager_b', email: 'manager_b@example.com', full_name: 'Manager B', id_number: 'MGR-B' }
  ];

  for (const m of managers) {
    await connection.query(
      `INSERT INTO users (username, email, password_hash, phone_number, user_type, status)
       SELECT ?, ?, ?, '+250788000100', 'manager', 'active'
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)`,
      [m.username, m.email, passwordHash, m.username]
    );
  }

  // Resolve manager user_ids
  const [[mgrAUser], [mgrBUser]] = await Promise.all([
    connection.query(`SELECT user_id FROM users WHERE username = 'manager_a' LIMIT 1`),
    connection.query(`SELECT user_id FROM users WHERE username = 'manager_b' LIMIT 1`)
  ]);
  const managerAUserId = mgrAUser[0]?.user_id;
  const managerBUserId = mgrBUser[0]?.user_id;

  // Create manager profiles
  if (managerAUserId) {
    await connection.query(
      `INSERT INTO managers (user_id, full_name, id_number, assigned_zones, employment_date)
       SELECT ?, 'Manager A', 'MGR-A', JSON_ARRAY(), CURDATE()
       WHERE NOT EXISTS (SELECT 1 FROM managers WHERE user_id = ?)`,
      [managerAUserId, managerAUserId]
    );
  }
  if (managerBUserId) {
    await connection.query(
      `INSERT INTO managers (user_id, full_name, id_number, assigned_zones, employment_date)
       SELECT ?, 'Manager B', 'MGR-B', JSON_ARRAY(), CURDATE()
       WHERE NOT EXISTS (SELECT 1 FROM managers WHERE user_id = ?)`,
      [managerBUserId, managerBUserId]
    );
  }

  // Resolve manager_ids
  const [[mgrARow], [mgrBRow]] = await Promise.all([
    connection.query(`SELECT manager_id FROM managers WHERE user_id = ?`, [managerAUserId]),
    connection.query(`SELECT manager_id FROM managers WHERE user_id = ?`, [managerBUserId])
  ]);
  const managerAId = mgrARow[0]?.manager_id || null;
  const managerBId = mgrBRow[0]?.manager_id || null;

  // Assign zones to managers (alternate zones)
  const [zones] = await connection.query(`SELECT zone_id FROM zones ORDER BY zone_id`);
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const owner = (i % 2 === 0) ? managerAId : managerBId;
    await connection.query(`UPDATE zones SET manager_id = ? WHERE zone_id = ?`, [owner, z.zone_id]);
  }

  // Ensure spaces.created_by_manager_id reflects zone owner
  await connection.query(`
    UPDATE spaces s
    JOIN zones z ON z.zone_id = s.zone_id
    SET s.created_by_manager_id = z.manager_id
  `);

  // Create 2 sellers per manager
  async function createSeller(username, email, full_name, id_number, createdByManagerId) {
    await connection.query(
      `INSERT INTO users (username, email, password_hash, phone_number, user_type, status)
       SELECT ?, ?, ?, '+250788000200', 'seller', 'active'
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)`,
      [username, email, passwordHash, username]
    );
    const [[u]] = await connection.query(`SELECT user_id FROM users WHERE username = ?`, [username]);
    const userId = u?.user_id;
    if (userId) {
      await connection.query(
        `INSERT INTO sellers (user_id, created_by_manager_id, full_name, id_number, business_name, business_type, registration_date, verification_status)
         SELECT ?, ?, ?, ?, CONCAT(?, ' Biz'), 'retail', CURDATE(), 'verified'
         WHERE NOT EXISTS (SELECT 1 FROM sellers WHERE user_id = ?)`,
        [userId, createdByManagerId, full_name, id_number, full_name, userId]
      );
    }
  }

  await createSeller('seller_a1', 'seller_a1@example.com', 'Seller A1', 'SLR-A1', managerAId);
  await createSeller('seller_a2', 'seller_a2@example.com', 'Seller A2', 'SLR-A2', managerAId);
  await createSeller('seller_b1', 'seller_b1@example.com', 'Seller B1', 'SLR-B1', managerBId);
  await createSeller('seller_b2', 'seller_b2@example.com', 'Seller B2', 'SLR-B2', managerBId);

  // Helper: allocate first available space within manager's zones to a seller
  async function allocateToFirstSpace(managerId, sellerUsername) {
    const [[sellerUser]] = await connection.query(`SELECT user_id FROM users WHERE username = ?`, [sellerUsername]);
    if (!sellerUser) return;
    const [[sellerRow]] = await connection.query(`SELECT seller_id FROM sellers WHERE user_id = ?`, [sellerUser.user_id]);
    const sellerId = sellerRow?.seller_id;

    const [[spaceRow]] = await connection.query(`
      SELECT sp.space_id
      FROM spaces sp
      JOIN zones z ON z.zone_id = sp.zone_id
      WHERE z.manager_id = ? AND sp.status = 'available'
      ORDER BY sp.space_id
      LIMIT 1
    `, [managerId]);

    if (!sellerId || !spaceRow) return;

    await connection.query(
      `INSERT INTO space_allocations 
       (seller_id, space_id, allocation_date, start_date, end_date, allocation_type, created_by_manager_id, status, notes)
       VALUES (?, ?, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'monthly', ?, 'active', 'Seeded allocation')`,
      [sellerId, spaceRow.space_id, managerId]
    );

    const [[alloc]] = await connection.query(
      `SELECT allocation_id FROM space_allocations WHERE seller_id = ? AND space_id = ? ORDER BY allocation_id DESC LIMIT 1`,
      [sellerId, spaceRow.space_id]
    );

    // Payment
    await connection.query(
      `INSERT INTO payments 
       (allocation_id, seller_id, amount, payment_date, payment_method, payment_reference, payment_period_start, payment_period_end, status, notes)
       VALUES (?, ?, 15000.00, NOW(), 'mobile_money', CONCAT('SEED-', ?), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'completed', 'Seeded payment')`,
      [alloc.allocation_id, sellerId, alloc.allocation_id]
    );
  }

  // Allocate and pay for first seller per manager
  await allocateToFirstSpace(managerAId, 'seller_a1');
  await allocateToFirstSpace(managerBId, 'seller_b1');

  console.log('  → Managers, sellers, allocations, payments seeded');
}
