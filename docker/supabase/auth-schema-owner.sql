-- Transfer auth schema ownership to supabase_auth_admin so GoTrue
-- migrations can CREATE OR REPLACE functions in the auth schema.
-- The supabase/postgres image creates these objects as the superuser;
-- GoTrue connects as supabase_auth_admin and needs ownership to migrate.

ALTER SCHEMA auth OWNER TO supabase_auth_admin;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'auth' LOOP
    EXECUTE format('ALTER TABLE auth.%I OWNER TO supabase_auth_admin', rec.tablename);
  END LOOP;

  FOR rec IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'auth' LOOP
    EXECUTE format('ALTER SEQUENCE auth.%I OWNER TO supabase_auth_admin', rec.sequencename);
  END LOOP;

  FOR rec IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth'
  LOOP
    EXECUTE format('ALTER FUNCTION auth.%I(%s) OWNER TO supabase_auth_admin', rec.proname, rec.args);
  END LOOP;
END $$;

GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
