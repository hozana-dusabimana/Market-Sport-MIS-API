export async function seed(connection) {
  console.log('  → Seeding zones...');
  
  // Create zones
  const zones = [
    { zone_name: 'Zone A - North Wing', zone_code: 'ZA-001', description: 'Northern market section', manager_id: null, total_spaces: 20 },
    { zone_name: 'Zone B - South Wing', zone_code: 'ZB-001', description: 'Southern market section', manager_id: null, total_spaces: 25 },
    { zone_name: 'Zone C - East Wing', zone_code: 'ZC-001', description: 'Eastern market section', manager_id: null, total_spaces: 15 },
    { zone_name: 'Zone D - West Wing', zone_code: 'ZD-001', description: 'Western market section', manager_id: null, total_spaces: 18 }
  ];

  for (const zone of zones) {
    await connection.query(
      `INSERT INTO zones (zone_name, zone_code, description, manager_id, total_spaces, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [zone.zone_name, zone.zone_code, zone.description, zone.manager_id, zone.total_spaces]
    );
  }

  console.log('  → Zones created successfully');

  // Get zone IDs
  const [zonesData] = await connection.query('SELECT zone_id FROM zones ORDER BY zone_id');

  console.log('  → Seeding spaces...');
  
  let spaceNumber = 1;
  
  // Create spaces for each zone
  for (const zone of zonesData) {
    const spaceTypes = ['standard', 'premium', 'corner', 'storage'];
    const dailyRates = { standard: 500, premium: 800, corner: 1000, storage: 300 };
    const weeklyRates = { standard: 3000, premium: 4500, corner: 5500, storage: 1800 };
    const monthlyRates = { standard: 10000, premium: 15000, corner: 18000, storage: 6000 };
    
    // Create 5-6 spaces per zone
    const spacesPerZone = Math.floor(Math.random() * 2) + 5;
    
    for (let i = 0; i < spacesPerZone; i++) {
      const spaceType = spaceTypes[Math.floor(Math.random() * spaceTypes.length)];
      const sizeArr = [50, 75, 100, 150, 200];
      const size = sizeArr[Math.floor(Math.random() * sizeArr.length)];
      
      await connection.query(
        `INSERT INTO spaces 
         (zone_id, space_number, space_type, size_sqm, daily_rate, weekly_rate, monthly_rate, status, features)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?)`,
        [
          zone.zone_id,
          `SP-${String(spaceNumber).padStart(3, '0')}`,
          spaceType,
          size,
          dailyRates[spaceType],
          weeklyRates[spaceType],
          monthlyRates[spaceType],
          'Standard market space with good visibility'
        ]
      );
      
      spaceNumber++;
    }
  }

  console.log('  → Spaces created successfully');
}
