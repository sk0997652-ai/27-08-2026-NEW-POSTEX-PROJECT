-- ==========================================================
-- POSTEX HR PORTAL — DATABASE MIGRATION 002: ROW LEVEL SECURITY
-- Enforcing Multi-Tenant Zonal Scoping and Defense-in-Depth
-- ==========================================================

-- Enable Row Level Security across sensitive entities
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
CREATE POLICY "Super Admin manage all users"
ON users FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "Staff view colleagues"
ON users FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- 2. ZONE ASSIGNMENTS POLICIES
CREATE POLICY "Super Admin manage zone assignments"
ON zone_assignments FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "Users view own zone assignments"
ON zone_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. PERMISSION OVERRIDES POLICIES (Strictly Super Admin Managed)
CREATE POLICY "Super Admin manage permission overrides"
ON user_permission_overrides FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'SUPER_ADMIN'
)
WITH CHECK (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'SUPER_ADMIN'
);

-- 4. CANDIDATES POLICIES (Zone / Branch Scoped & Candidate Self-Access)
CREATE POLICY "Super Admin and Central HR manage candidates"
ON candidates FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'CENTRAL_HR')
);

CREATE POLICY "Zonal HR view candidates in assigned zones"
ON candidates FOR SELECT
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'ZONAL_HR_MANAGER'
  AND EXISTS (
    SELECT 1 FROM zone_assignments za
    WHERE za.user_id = auth.uid()
    AND za.zone_id = candidates.zone_id
  )
);

CREATE POLICY "Branch Manager view candidates in assigned branch"
ON candidates FOR SELECT
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'BRANCH_MANAGER'
  AND EXISTS (
    SELECT 1 FROM zone_assignments za
    WHERE za.user_id = auth.uid()
    AND za.branch_id = candidates.branch_id
  )
);

CREATE POLICY "Candidates view and manage own candidate profile"
ON candidates FOR ALL
TO authenticated
USING (
  id = auth.uid()
  OR (SELECT email FROM users WHERE id = auth.uid()) = candidates.email
);

-- 5. APPLICATIONS POLICIES (Scoped by Candidate & Operational Tier)
CREATE POLICY "Candidates view and update own application"
ON applications FOR ALL
TO authenticated
USING (
  candidate_id = auth.uid()
  OR candidate_id IN (SELECT id FROM candidates WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Super Admin and Central HR manage all applications"
ON applications FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'CENTRAL_HR')
);

CREATE POLICY "Zonal HR view applications in assigned zone"
ON applications FOR SELECT
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'ZONAL_HR_MANAGER'
  AND EXISTS (
    SELECT 1 FROM candidates c
    JOIN zone_assignments za ON za.zone_id = c.zone_id
    WHERE c.id = applications.candidate_id
    AND za.user_id = auth.uid()
  )
);

CREATE POLICY "Branch Manager view and update applications in assigned branch"
ON applications FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'BRANCH_MANAGER'
  AND EXISTS (
    SELECT 1 FROM candidates c
    JOIN zone_assignments za ON za.branch_id = c.branch_id
    WHERE c.id = applications.candidate_id
    AND za.user_id = auth.uid()
  )
);

-- 6. DOCUMENTS POLICIES (Strict Document Isolation)
CREATE POLICY "Candidates manage own documents"
ON documents FOR ALL
TO authenticated
USING (
  candidate_id = auth.uid()
  OR candidate_id IN (SELECT id FROM candidates WHERE email = (SELECT email FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Staff view documents within assigned scope"
ON documents FOR SELECT
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'CENTRAL_HR')
  OR (
    (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'ZONAL_HR_MANAGER'
    AND EXISTS (
      SELECT 1 FROM candidates c
      JOIN zone_assignments za ON za.zone_id = c.zone_id
      WHERE c.id = documents.candidate_id AND za.user_id = auth.uid()
    )
  )
  OR (
    (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'BRANCH_MANAGER'
    AND EXISTS (
      SELECT 1 FROM candidates c
      JOIN zone_assignments za ON za.branch_id = c.branch_id
      WHERE c.id = documents.candidate_id AND za.user_id = auth.uid()
    )
  )
);

-- 7. EMPLOYEES POLICIES (Employee view own records; HR manage)
CREATE POLICY "Super Admin and Central HR manage employees"
ON employees FOR ALL
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'CENTRAL_HR')
);

CREATE POLICY "Employees view only their own record"
ON employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR candidate_id = auth.uid()
);

-- 8. AUDIT LOGS POLICIES (Super Admin Strict Read-Only + System Insert)
CREATE POLICY "Super Admin view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  (SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "System insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);
