import "dotenv/config";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

/**
 * Migration Script: Export Database Schema
 * 
 * This script exports the current database schema so it can be
 * recreated in a new Supabase account.
 */

async function exportSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const queryClient = postgres(databaseUrl);

  try {
    console.log("📤 Exporting database schema...");

    // Export table schemas
    const tablesQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    const tables = await queryClient.unsafe(tablesQuery);

    // Export foreign keys
    const foreignKeysQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;

    const foreignKeys = await queryClient.unsafe(foreignKeysQuery);

    // Export indexes
    const indexesQuery = `
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const indexes = await queryClient.unsafe(indexesQuery);

    console.log(`✅ Exported ${tables.length} columns, ${foreignKeys.length} foreign keys, ${indexes.length} indexes`);

    return {
      tables,
      foreignKeys,
      indexes,
    };

  } catch (error: any) {
    console.error("❌ Error exporting schema:", error.message);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportSchema()
    .then(() => {
      console.log("✅ Schema export complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to export schema:", error);
      process.exit(1);
    });
}

export { exportSchema };

