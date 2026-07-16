Apply this migration manually on the existing database before relying on Prisma runtime fields such as Organization.plan or Organization.idu.

Recommended order:

1. Execute `migration.sql` against the target PostgreSQL database.
2. Verify the app boots and the dashboard loads.
3. Mark the migration as applied in Prisma once the SQL has run successfully.
