-- The application accesses these tables through the server-side Prisma connection.
REVOKE ALL ON SCHEMA "pocket" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA "pocket" FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE "pocket"."Pocket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pocket"."Expense" ENABLE ROW LEVEL SECURITY;
