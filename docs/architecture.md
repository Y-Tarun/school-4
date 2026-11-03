# School ERP Architecture

## 1. Scope

This application is a single-school ERP for:

- **Admin**: full student, fee-paid, and staff management; bulk student ID-card PDF generation.
- **Teacher**: create/read/update student data; read fee-paid and staff data.
- **Caretaker**: read student and staff data.
- **Driver**: read student and staff data.

The first milestone is the application foundation: authentication, authorization, domain boundaries, API contracts, migrations, and role-aware UI structure.

## 2. Existing implementation

- Frontend: React, Vite, TypeScript, MUI, React Router, Redux Toolkit.
- Backend: Express 5, CommonJS, PostgreSQL, `pg`, SQL-file migrations.
- Current student list is hard-coded in the backend and the student profile reads local fixture data.
- Initial database migrations contain a wide `students` table and preliminary `users`, `roles`, role-map, event-type, and activity-log tables.
- There is no authentication, authorization middleware, feature-level API structure, or PDF service yet.

The current frontend conventions should be retained: feature folders, typed Redux actions/reducers/effects/selectors, a shared HTTP client, and MUI components. The backend should evolve from the current single `app.js` into feature modules rather than accumulating route handlers in that file.

## 3. Logical architecture

```text
React routes
  -> protected route / role-aware navigation
  -> feature UI (students, staff, fees, ID cards)
  -> Redux feature state + effects
  -> shared HTTP client
  -> Express route modules
  -> authentication + authorization middleware
  -> application services
  -> repositories / parameterized SQL
  -> PostgreSQL
```

Cross-cutting services:

- **Authentication**: password hashing, login, session/token lifecycle, current-user endpoint.
- **Authorization**: role checks on every protected API route.
- **Validation**: request DTO validation before service calls.
- **Audit**: actor, action, entity, entity identifier, timestamp, and relevant metadata.
- **Error handling**: one JSON error shape and centralized Express error middleware.

The server is the authorization source of truth. Frontend role checks only hide unavailable actions and improve navigation.

## 4. Core data model

### Identity and access

- `users`: login identity, display name, status, password hash, timestamps.
- `roles`: `admin`, `teacher`, `caretaker`, `driver`.
- `user_roles`: many-to-many mapping, allowing a person to hold more than one operational role.
- `sessions` (or a refresh-token equivalent): revocable login sessions with expiry and last-used timestamps.
- `audit_logs`: immutable actor/action/entity records.

Do not store plaintext passwords. Do not use the existing `photolocator` column as a password or identity field.

### Academic context

- `academic_years`: named period with start/end dates and active status.
- `classes`: seed values `Playway`, `Nursery`, `LKG`, `UKG`.
- `sections`: section name scoped to a class and academic year.

### Students

- `students`: stable identifier, admission/application number, personal details, parent/guardian details, contact/address, photo reference, lifecycle status, and soft-delete metadata.
- `student_enrollments`: student + academic year + class + section, with a uniqueness constraint for one active enrollment per year.

Keep academic placement out of the core student identity row. This preserves historical class/section data when a student advances.

### Staff

- `staff`: person details, staff number, contact details, employment status, and optional photo reference.
- `staff_roles` (or the existing user-role mapping when staff login identity is required): operational role assignment.

The design should distinguish a staff profile from a login account. A staff member may exist without system access; a user account may be linked only when access is needed.

### Fees paid

The first version records payments only:

- `fee_payments`: student, academic year, amount, paid-on date, payment mode, receipt/reference number, notes, and created-by user.

This intentionally excludes fee heads, schedules, invoices, discounts, late fees, and balance calculation. Those can be added later without changing student identity or enrollment.

## 5. RBAC matrix

| Capability | Admin | Teacher | Caretaker | Driver |
|---|---:|---:|---:|---:|
| Read students/details | yes | yes | yes | yes |
| Create/update students/details | yes | yes | no | no |
| Delete/archive students | yes | no | no | no |
| Read fee-paid records | yes | yes | no | no |
| Create/update fee-paid records | yes | no | no | no |
| Read staff details | yes | yes | yes | yes |
| Create/update/archive staff | yes | no | no | no |
| Generate bulk student ID cards | yes | no | no | no |
| Manage users/roles | yes | no | no | no |

Use explicit permissions in middleware rather than scattering role-name checks through handlers. Example permissions: `students:read`, `students:write`, `fees:read`, `fees:write`, `staff:read`, `staff:write`, `id_cards:generate`, `users:manage`.

## 6. API boundary

All routes are under `/api`.

### Authentication

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Students

- `GET /students` with pagination, search, academic year/class/section filters.
- `GET /students/:studentId`
- `POST /students`
- `PATCH /students/:studentId`
- `DELETE /students/:studentId` (archive/soft delete)

### Staff

- `GET /staff`
- `GET /staff/:staffId`
- `POST /staff`
- `PATCH /staff/:staffId`
- `DELETE /staff/:staffId` (archive/soft delete)

### Fee-paid records

- `GET /students/:studentId/fee-payments`
- `POST /students/:studentId/fee-payments`
- `PATCH /fee-payments/:paymentId`

### ID cards

- `POST /id-cards/student-batch`

The request contains selected student IDs and the relevant academic year/enrollment context. The response should be a PDF download or a short-lived download reference, not a large JSON payload. The service must re-fetch and authorize all records server-side rather than trusting client-provided student details.

Use a consistent error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {}
  }
}
```

## 7. Backend structure

Target structure:

```text
backend/
  app.js
  db.js
  middleware/
    authenticate.js
    authorize.js
    errorHandler.js
    validate.js
  modules/
    auth/
      auth.routes.js
      auth.service.js
      auth.repository.js
    students/
    staff/
    fees/
    idCards/
  shared/
    errors.js
    audit.js
    pagination.js
  migrations/
```

Route handlers should translate HTTP input/output only. Services own use-case rules, repositories own SQL, and middleware owns cross-cutting request concerns.

## 8. Frontend structure

Target routes:

```text
/login
/dashboard
/students
/students/:studentId
/staff
/staff/:staffId
/students/:studentId/fees
```

Target feature boundaries:

```text
frontend/src/
  app/
    ProtectedRoute.tsx
    RoleGate.tsx
  features/
    auth/
    students/
    staff/
    fees/
    idCards/
  components/
  redux/
  utility/
```

Each feature should own its types, actions/effects, reducer/selectors, and UI. Shared presentation components belong outside feature folders. Route loaders or effects must represent loading, empty, validation, authorization, and server-error states explicitly.

## 9. ID-card contract

The admin selects students from the student list. The backend validates that:

1. the caller has `id_cards:generate`;
2. every selected student exists and is not archived;
3. the requested enrollment context is valid;
4. required card fields are present.

Each card contains the student photo, student name, class, father's name, contact number, and configured school name. The school name should be configuration, not duplicated in every student row. PDF page size, cards per page, branding, and print orientation remain configurable decisions before implementation.

## 10. Delivery and verification order

1. Replace/extend migrations with normalized identity, academic, student, staff, and fee-paid structures.
2. Add password hashing, login/session handling, `/auth/me`, and authorization middleware.
3. Split backend routes into modules with validation, repositories, services, and error handling.
4. Replace hard-coded student data with the student API and protected routes.
5. Add staff and fee-paid read/write boundaries according to the matrix.
6. Add the admin-only ID-card service and download flow.
7. Add integration tests for permission boundaries and migration checks, then frontend tests for protected navigation and core states.

Before implementation, confirm password-reset requirements, session strategy, required student/staff fields, fee payment modes, school configuration/branding, and PDF page layout.
