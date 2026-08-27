-- ==========================================================
-- POSTEX HR PORTAL — DATABASE SEED 004: CORE RBAC & ORG HIERARCHY
-- PostEx Production Seed Data (Zones, Branches, Roles, Permissions)
-- ==========================================================

-- 1. Insert Roles
INSERT INTO roles (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'SUPER_ADMIN', 'Complete administrative governance and organizational control'),
  ('11111111-1111-1111-1111-111111111102', 'ZONAL_HR_MANAGER', 'Zonal operations oversight and regional branch governance'),
  ('11111111-1111-1111-1111-111111111103', 'CENTRAL_HR', 'Nationwide candidate onboarding, review, and employment conversion'),
  ('11111111-1111-1111-1111-111111111104', 'BRANCH_MANAGER', 'Physical document verification, candidate interview, and local forwarding'),
  ('11111111-1111-1111-1111-111111111105', 'EMPLOYEE_CANDIDATE', 'Self-service onboarding application and document submission')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Granular Permissions
INSERT INTO permissions (id, code, module, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'org:manage_zones', 'ORGANIZATION', 'Create, update, and toggle active status of operational zones'),
  ('22222222-2222-2222-2222-222222222202', 'org:manage_branches', 'ORGANIZATION', 'Create, update, and manage branches within zones'),
  ('22222222-2222-2222-2222-222222222203', 'org:manage_departments', 'ORGANIZATION', 'Manage company departments and designations'),
  ('22222222-2222-2222-2222-222222222204', 'users:manage_staff', 'USER_MANAGEMENT', 'Create staff users, assign roles, and allocate zone boundaries'),
  ('22222222-2222-2222-2222-222222222205', 'users:override_permissions', 'USER_MANAGEMENT', 'Grant or revoke custom user permissions with mandatory audit reason'),
  ('22222222-2222-2222-2222-222222222206', 'audit:view', 'AUDIT', 'View system-wide immutable audit trail logs'),
  ('22222222-2222-2222-2222-222222222207', 'candidate:create', 'CANDIDATE', 'Register new onboarding candidates and dispatch joining credentials'),
  ('22222222-2222-2222-2222-222222222208', 'candidate:view_nationwide', 'CANDIDATE', 'Access candidate dossiers across all zones nationwide'),
  ('22222222-2222-2222-2222-222222222209', 'candidate:view_zonal', 'CANDIDATE', 'Access candidate dossiers within assigned zone boundary'),
  ('22222222-2222-2222-2222-222222222210', 'candidate:view_branch', 'CANDIDATE', 'Access candidate dossiers within assigned branch boundary'),
  ('22222222-2222-2222-2222-222222222211', 'candidate:verify_branch', 'VERIFICATION', 'Perform branch-level physical document checks and forward to Central HR'),
  ('22222222-2222-2222-2222-222222222212', 'candidate:decide_central', 'VERIFICATION', 'Final approval, return for correction, or reject onboarding candidate'),
  ('22222222-2222-2222-2222-222222222213', 'candidate:generate_dossier', 'VERIFICATION', 'Generate formal PostEx Joining Dossier PDF and convert to Employee')
ON CONFLICT (code) DO NOTHING;

-- 3. Map Default Role Permissions
-- Super Admin: Has all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111101', id FROM permissions
ON CONFLICT DO NOTHING;

-- Zonal HR Manager: Zonal candidate view, branch oversight, reporting
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111102', id FROM permissions
WHERE code IN ('candidate:view_zonal', 'candidate:create', 'org:manage_branches')
ON CONFLICT DO NOTHING;

-- Central HR: Nationwide candidate creation, viewing, decisioning, dossier generation
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111103', id FROM permissions
WHERE code IN ('candidate:create', 'candidate:view_nationwide', 'candidate:decide_central', 'candidate:generate_dossier', 'org:manage_departments')
ON CONFLICT DO NOTHING;

-- Branch Manager: Branch candidate view, physical verification & remarks
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111104', id FROM permissions
WHERE code IN ('candidate:view_branch', 'candidate:verify_branch')
ON CONFLICT DO NOTHING;

-- 4. Insert Initial PostEx Zones & Branches
INSERT INTO zones (id, code, name, description) VALUES
  ('33333333-3333-3333-3333-333333333301', 'ZONE-NORTH', 'Zone North (Punjab & KPK)', 'Operational region covering Lahore, Rawalpindi, Islamabad, Peshawar, Faisalabad'),
  ('33333333-3333-3333-3333-333333333302', 'ZONE-SOUTH', 'Zone South (Sindh & Balochistan)', 'Operational region covering Karachi, Hyderabad, Sukkur, Quetta')
ON CONFLICT (code) DO NOTHING;

INSERT INTO branches (id, zone_id, code, name, city, address) VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'BR-LHR-01', 'Lahore Central Hub', 'Lahore', 'Plot 42, Industrial Area, Gulberg III, Lahore'),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'BR-ISB-01', 'Islamabad Main Facility', 'Islamabad', 'Sector I-9/3, Industrial Area, Islamabad'),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333302', 'BR-KHI-01', 'Karachi Port Mega Hub', 'Karachi', 'Korangi Industrial Area, Sector 15, Karachi'),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', 'BR-HYD-01', 'Hyderabad Regional Center', 'Hyderabad', 'Auto Bhan Road, Latifabad, Hyderabad')
ON CONFLICT (code) DO NOTHING;

-- 5. Insert Departments & Designations
INSERT INTO departments (id, code, name) VALUES
  ('55555555-5555-5555-5555-555555555501', 'DEPT-OPS', 'Logistics & Fleet Operations'),
  ('55555555-5555-5555-5555-555555555502', 'DEPT-FIN', 'Finance & Cash-on-Delivery (COD)'),
  ('55555555-5555-5555-5555-555555555503', 'DEPT-TECH', 'Technology & Systems Engineering'),
  ('55555555-5555-5555-5555-555555555504', 'DEPT-HR', 'Human Resources & People Operations')
ON CONFLICT (code) DO NOTHING;

INSERT INTO designations (id, department_id, code, title) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'DESIG-RDR', 'Last-Mile Courier / Rider'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'DESIG-HUB-SUP', 'Hub Operations Supervisor'),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', 'DESIG-COD-AUD', 'COD Reconciliation Specialist'),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 'DESIG-HR-EXEC', 'Onboarding Executive')
ON CONFLICT (code) DO NOTHING;

-- 6. Insert Sample Staff Users (One per Core Role)
-- Note: Authentication credentials managed via Supabase Auth; no plain passwords stored.
INSERT INTO users (id, email, first_name, last_name, phone, role_id, is_active, two_factor_enabled) VALUES
  ('77777777-7777-7777-7777-777777777701', 'superadmin@postex.pk', 'Tariq', 'Malik', '+92-300-1110001', '11111111-1111-1111-1111-111111111101', TRUE, TRUE),
  ('77777777-7777-7777-7777-777777777702', 'zonal.hr@postex.pk', 'Ayesha', 'Siddiqui', '+92-300-1110002', '11111111-1111-1111-1111-111111111102', TRUE, FALSE),
  ('77777777-7777-7777-7777-777777777703', 'central.hr@postex.pk', 'Bilal', 'Hassan', '+92-300-1110003', '11111111-1111-1111-1111-111111111103', TRUE, TRUE),
  ('77777777-7777-7777-7777-777777777704', 'branch.mgr@postex.pk', 'Kamran', 'Abbasi', '+92-300-1110004', '11111111-1111-1111-1111-111111111104', TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

-- 7. Insert Zone and Branch Assignments
INSERT INTO zone_assignments (id, user_id, zone_id, branch_id, assigned_by) VALUES
  -- Zonal HR Manager: Assigned to Zone North (Punjab & KPK)
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777702', '33333333-3333-3333-3333-333333333301', NULL, '77777777-7777-7777-7777-777777777701'),
  -- Branch Manager: Assigned to Lahore Central Hub within Zone North
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777704', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401', '77777777-7777-7777-7777-777777777701')
ON CONFLICT DO NOTHING;

-- 8. Insert User Permission Overrides (Audit Traceable)
INSERT INTO user_permission_overrides (id, user_id, permission_id, is_granted, reason, granted_by) VALUES
  -- Granting temporary branch management override to Zonal HR with audit justification
  ('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222202', TRUE, 'Temporary operational expansion approval during Q3 Hub launch', '77777777-7777-7777-7777-777777777701')
ON CONFLICT DO NOTHING;

-- 9. Insert Sample Candidate & Application Pipeline
INSERT INTO candidates (
  id, joining_id, first_name, last_name, father_name, cnic, mobile, email,
  date_of_birth, gender, marital_status, current_address, permanent_address,
  zone_id, branch_id, department_id, designation_id, expected_joining_date,
  status, created_by
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'PX-JOIN-2026-0891',
    'Hamza',
    'Rasheed',
    'Rasheed Ahmed',
    '35201-8934123-1',
    '+92-321-4455667',
    'hamza.rasheed@example.com',
    '1998-04-14',
    'MALE',
    'SINGLE',
    'House 12, Street 4, Gulshan-e-Ravi, Lahore',
    'Village 44-GB, Samundri, Faisalabad',
    '33333333-3333-3333-3333-333333333301',
    '44444444-4444-4444-4444-444444444401',
    '55555555-5555-5555-5555-555555555501',
    '66666666-6666-6666-6666-666666666601',
    '2026-09-01',
    'BRANCH_VERIFIED',
    '77777777-7777-7777-7777-777777777703'
  )
ON CONFLICT (joining_id) DO NOTHING;

INSERT INTO applications (
  id, candidate_id, current_step, total_steps, submitted_at,
  branch_verified_at, branch_verified_by, status
) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    5,
    6,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    '77777777-7777-7777-7777-777777777704',
    'BRANCH_VERIFIED'
  )
ON CONFLICT (candidate_id) DO NOTHING;

-- 10. Insert Sample Verification Remarks & Audit Logs
INSERT INTO verification_remarks (
  id, application_id, author_id, author_role, stage, remark, is_internal_only
) VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '77777777-7777-7777-7777-777777777704',
    'BRANCH_MANAGER',
    'BRANCH_VERIFIED',
    'Physical CNIC and original motorcycle driving license inspected at Lahore Central Hub. In-person interview completed.',
    FALSE
  )
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (
  id, actor_id, actor_email, actor_role, action, entity_type, entity_id,
  zone_id, branch_id, old_state, new_state, reason
) VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '77777777-7777-7777-7777-777777777701',
    'superadmin@postex.pk',
    'SUPER_ADMIN',
    'USER_REGISTERED',
    'USERS',
    '77777777-7777-7777-7777-777777777702',
    '33333333-3333-3333-3333-333333333301',
    NULL,
    NULL,
    '{"email": "zonal.hr@postex.pk", "role": "ZONAL_HR_MANAGER"}'::jsonb,
    'Zonal HR Onboarding initialization'
  )
ON CONFLICT DO NOTHING;
