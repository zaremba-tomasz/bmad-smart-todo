\set pgpass `echo "$POSTGRES_PASSWORD"`
SELECT set_config('app.pgpass', :'pgpass', false);

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['authenticator','pgbouncer','supabase_auth_admin','supabase_functions_admin','supabase_storage_admin']
  LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('ALTER ROLE %I WITH PASSWORD %L', r, current_setting('app.pgpass'));
    END IF;
  END LOOP;
END $$;
