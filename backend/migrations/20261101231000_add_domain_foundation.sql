CREATE TABLE IF NOT EXISTS academic_years (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (ends_on > starts_on)
);

CREATE TABLE IF NOT EXISTS classes (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sections (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years (uuid) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes (uuid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (academic_year_id, class_id, name)
);

INSERT INTO classes (name)
VALUES ('Playway'), ('Nursery'), ('LKG'), ('UKG')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_reference TEXT;

ALTER TABLE students
  ALTER COLUMN date_of_admission DROP NOT NULL,
  ALTER COLUMN name_used_at_home DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN language_spoken_at_home DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN previous_schooling_details DROP NOT NULL,
  ALTER COLUMN father_name DROP NOT NULL,
  ALTER COLUMN father_occupation DROP NOT NULL,
  ALTER COLUMN father_qualification DROP NOT NULL,
  ALTER COLUMN father_contact_number DROP NOT NULL,
  ALTER COLUMN mother_name DROP NOT NULL,
  ALTER COLUMN mother_occupation DROP NOT NULL,
  ALTER COLUMN mother_qualification DROP NOT NULL,
  ALTER COLUMN mother_contact_number DROP NOT NULL,
  ALTER COLUMN contact_number DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active';

CREATE TABLE IF NOT EXISTS student_enrollments (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years (uuid),
  class_id UUID NOT NULL REFERENCES classes (uuid),
  section_id UUID REFERENCES sections (uuid),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, academic_year_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS student_enrollments_current_student_idx
  ON student_enrollments (student_id)
  WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS staff (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'caretaker', 'driver')),
  contact_number TEXT,
  photo_reference TEXT,
  user_id UUID REFERENCES users (uuid) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_payments (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years (uuid),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users (uuid),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fee_payments_student_id_idx
  ON fee_payments (student_id);

CREATE TABLE IF NOT EXISTS school_gallery (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  photo_reference TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users (uuid),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS students_archived_at_idx
  ON students (archived_at);

CREATE INDEX IF NOT EXISTS staff_archived_at_idx
  ON staff (archived_at);

CREATE INDEX IF NOT EXISTS school_gallery_archived_at_idx
  ON school_gallery (archived_at);
