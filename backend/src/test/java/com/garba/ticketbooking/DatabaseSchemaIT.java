package com.garba.ticketbooking;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseSchemaIT {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Test
    void flywayMigrationIsApplied() {
        assertThat(flyway.info().current()).isNotNull();
        Integer applied = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success = 1",
                Integer.class);
        assertThat(applied).isEqualTo(1);
    }

    @Test
    void requiredTablesExist() {
        String[] tables = {
                "admins", "customers", "ticket_categories", "bookings", "booking_items",
                "payments", "tickets", "entry_scans", "audit_logs"
        };

        for (String table : tables) {
            Integer count = jdbcTemplate.queryForObject(
                    "select count(*) from information_schema.tables where table_schema = database() and table_name = ?",
                    Integer.class, table);
            assertThat(count).as("table %s", table).isEqualTo(1);
        }
    }

    @Test
    void criticalConstraintsExist() {
        Integer uniqueCount = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.table_constraints " +
                        "where table_schema = database() and constraint_type = 'UNIQUE' " +
                        "and constraint_name in ('uq_admins_email','uq_bookings_reference','uq_tickets_qr_token')",
                Integer.class);
        assertThat(uniqueCount).isEqualTo(3);

        Integer foreignKeyCount = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.table_constraints " +
                        "where table_schema = database() and constraint_type = 'FOREIGN KEY'",
                Integer.class);
        assertThat(foreignKeyCount).isGreaterThanOrEqualTo(8);

        Integer inventoryChecks = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.check_constraints " +
                        "where constraint_schema = database() and constraint_name in " +
                        "('chk_ticket_categories_total_qty','chk_ticket_categories_available_qty','chk_ticket_categories_inventory')",
                Integer.class);
        assertThat(inventoryChecks).isEqualTo(3);
    }
}
