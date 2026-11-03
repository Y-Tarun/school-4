CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT ,
  photolocator TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE CHECK (
    role_name IN ('admin', 'teacher', 'caretaker', 'driver')
  )
);

CREATE TABLE IF NOT EXISTS user_role_maps (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (uuid) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles (uuid) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS event_types (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (uuid) ON DELETE CASCADE,
  "createdOn" TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type_id UUID NOT NULL REFERENCES event_types (uuid),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS user_role_maps_user_id_idx
  ON user_role_maps (user_id);

CREATE INDEX IF NOT EXISTS user_role_maps_role_id_idx
  ON user_role_maps (role_id);

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx
  ON activity_logs (user_id);

CREATE INDEX IF NOT EXISTS activity_logs_event_type_id_idx
  ON activity_logs (event_type_id);

CREATE INDEX IF NOT EXISTS activity_logs_created_on_idx
  ON activity_logs ("createdOn");

INSERT INTO roles (role_name)
VALUES ('admin'), ('teacher'), ('caretaker'), ('driver')
ON CONFLICT (role_name) DO NOTHING;