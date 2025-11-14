export async function up(connection) {
  // Add created_by_manager_id to sellers
  await connection.query(`
    ALTER TABLE sellers 
    ADD COLUMN created_by_manager_id INT NULL AFTER user_id,
    ADD CONSTRAINT fk_sellers_created_by_manager 
      FOREIGN KEY (created_by_manager_id) REFERENCES managers(manager_id) 
      ON DELETE SET NULL
  `);

  // Add created_by_manager_id to spaces and index
  await connection.query(`
    ALTER TABLE spaces 
    ADD COLUMN created_by_manager_id INT NULL AFTER zone_id,
    ADD INDEX idx_space_created_by (created_by_manager_id)
  `);

  // Trigger: default spaces.created_by_manager_id to zones.manager_id if not provided
  await connection.query('DROP TRIGGER IF EXISTS trg_spaces_set_creator');
  await connection.query(`
    CREATE TRIGGER trg_spaces_set_creator 
    BEFORE INSERT ON spaces 
    FOR EACH ROW 
    BEGIN 
      IF NEW.created_by_manager_id IS NULL THEN 
        SET NEW.created_by_manager_id = (
          SELECT z.manager_id FROM zones z WHERE z.zone_id = NEW.zone_id
        );
      END IF; 
    END
  `);

  // Add created_by_manager_id to space_allocations and indexes
  await connection.query(`
    ALTER TABLE space_allocations 
    ADD COLUMN created_by_manager_id INT NULL AFTER allocation_type,
    ADD INDEX idx_alloc_created_by (created_by_manager_id)
  `);

  // Helpful indexes for ownership queries
  await connection.query(`
    ALTER TABLE zones 
    ADD INDEX idx_zone_manager (manager_id)
  `);

  // Views to simplify manager-scoped queries
  await connection.query('DROP VIEW IF EXISTS vw_manager_zones');
  await connection.query(`
    CREATE VIEW vw_manager_zones AS 
      SELECT 
        z.*, 
        z.manager_id AS owner_manager_id 
      FROM zones z
  `);

  await connection.query('DROP VIEW IF EXISTS vw_manager_spaces');
  await connection.query(`
    CREATE VIEW vw_manager_spaces AS 
      SELECT 
        s.*, 
        z.manager_id AS owner_manager_id 
      FROM spaces s 
      JOIN zones z ON z.zone_id = s.zone_id
  `);

  await connection.query('DROP VIEW IF EXISTS vw_manager_allocations');
  await connection.query(`
    CREATE VIEW vw_manager_allocations AS 
      SELECT 
        a.*, 
        z.manager_id AS owner_manager_id 
      FROM space_allocations a 
      JOIN spaces sp ON sp.space_id = a.space_id
      JOIN zones z ON z.zone_id = sp.zone_id
  `);

  await connection.query('DROP VIEW IF EXISTS vw_manager_sellers');
  await connection.query(`
    CREATE VIEW vw_manager_sellers AS 
      SELECT 
        s.*, 
        s.created_by_manager_id AS owner_manager_id 
      FROM sellers s
  `);

  await connection.query('DROP VIEW IF EXISTS vw_manager_payments');
  await connection.query(`
    CREATE VIEW vw_manager_payments AS 
      SELECT 
        p.*, 
        z.manager_id AS owner_manager_id 
      FROM payments p 
      JOIN space_allocations a ON a.allocation_id = p.allocation_id 
      JOIN spaces sp ON sp.space_id = a.space_id 
      JOIN zones z ON z.zone_id = sp.zone_id
  `);
}

export async function down(connection) {
  // Drop views
  await connection.query('DROP VIEW IF EXISTS vw_manager_payments');
  await connection.query('DROP VIEW IF EXISTS vw_manager_sellers');
  await connection.query('DROP VIEW IF EXISTS vw_manager_allocations');
  await connection.query('DROP VIEW IF EXISTS vw_manager_spaces');
  await connection.query('DROP VIEW IF EXISTS vw_manager_zones');

  // Drop trigger
  await connection.query('DROP TRIGGER IF EXISTS trg_spaces_set_creator');

  // Remove added columns and constraints
  await connection.query(`
    ALTER TABLE space_allocations 
    DROP COLUMN created_by_manager_id
  `);

  await connection.query(`
    ALTER TABLE spaces 
    DROP INDEX idx_space_created_by,
    DROP COLUMN created_by_manager_id
  `);

  await connection.query(`
    ALTER TABLE sellers 
    DROP FOREIGN KEY fk_sellers_created_by_manager,
    DROP COLUMN created_by_manager_id
  `);

  await connection.query(`
    ALTER TABLE zones 
    DROP INDEX idx_zone_manager
  `);
}
