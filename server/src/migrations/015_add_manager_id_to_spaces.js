export async function up(connection) {
  // Add manager_id column to spaces for compatibility with controllers/queries
  await connection.query(`
    ALTER TABLE spaces 
    ADD COLUMN manager_id INT NULL AFTER zone_id,
    ADD INDEX idx_spaces_manager (manager_id)
  `);

  // Backfill manager_id from the owning zone
  await connection.query(`
    UPDATE spaces s
    JOIN zones z ON z.zone_id = s.zone_id
    SET s.manager_id = z.manager_id
  `);

  // Trigger to default manager_id from zone if not provided
  await connection.query('DROP TRIGGER IF EXISTS trg_spaces_set_manager');
  await connection.query(`
    CREATE TRIGGER trg_spaces_set_manager
    BEFORE INSERT ON spaces
    FOR EACH ROW
    BEGIN
      IF NEW.manager_id IS NULL THEN
        SET NEW.manager_id = (
          SELECT z.manager_id FROM zones z WHERE z.zone_id = NEW.zone_id
        );
      END IF;
    END
  `);
}

export async function down(connection) {
  // Drop trigger and column/index
  await connection.query('DROP TRIGGER IF EXISTS trg_spaces_set_manager');
  await connection.query(`
    ALTER TABLE spaces 
    DROP INDEX idx_spaces_manager,
    DROP COLUMN manager_id
  `);
}
