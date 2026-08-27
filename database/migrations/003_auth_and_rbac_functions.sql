-- ==========================================================
-- POSTEX HR PORTAL — DATABASE MIGRATION 003: AUTH & RBAC FUNCTIONS
-- 3-Layer Authorization Evaluation Stored Procedures
-- ==========================================================

-- Function: Check user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role_enum AS $$
  SELECT r.name FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function: Check if user has explicit or default permission (Layer 1 + Layer 2)
CREATE OR REPLACE FUNCTION auth.has_effective_permission(
  target_user_id UUID,
  permission_code VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_id UUID;
  v_role_name user_role_enum;
  v_permission_id UUID;
  v_has_role_perm BOOLEAN := FALSE;
  v_override_granted BOOLEAN;
BEGIN
  -- Super Admin inherently possesses all permissions
  SELECT r.id, r.name INTO v_role_id, v_role_name
  FROM users u JOIN roles r ON r.id = u.role_id
  WHERE u.id = target_user_id;

  IF v_role_name = 'SUPER_ADMIN' THEN
    RETURN TRUE;
  END IF;

  -- Audit logs are non-overrideable and strictly Super-Admin-only
  IF permission_code = 'audit:view' THEN
    RETURN FALSE;
  END IF;

  SELECT id INTO v_permission_id FROM permissions WHERE code = permission_code;
  IF v_permission_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Layer 2: Check User Permission Override First
  SELECT is_granted INTO v_override_granted
  FROM user_permission_overrides
  WHERE user_id = target_user_id AND permission_id = v_permission_id;

  IF v_override_granted IS NOT NULL THEN
    RETURN v_override_granted;
  END IF;

  -- Layer 1: Check Role Default Permission
  SELECT EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role_id = v_role_id AND permission_id = v_permission_id
  ) INTO v_has_role_perm;

  RETURN v_has_role_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Check Zone / Branch Geographic Scope (Layer 3)
CREATE OR REPLACE FUNCTION auth.can_access_scope(
  target_user_id UUID,
  target_zone_id UUID,
  target_branch_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_name user_role_enum;
BEGIN
  SELECT r.name INTO v_role_name
  FROM users u JOIN roles r ON r.id = u.role_id
  WHERE u.id = target_user_id;

  -- Super Admin and Central HR have nationwide scope
  IF v_role_name IN ('SUPER_ADMIN', 'CENTRAL_HR') THEN
    RETURN TRUE;
  END IF;

  -- If target is zonal
  IF target_zone_id IS NOT NULL AND target_branch_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM zone_assignments za
      WHERE za.user_id = target_user_id
      AND za.zone_id = target_zone_id
    );
  END IF;

  -- If target is branch
  IF target_branch_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM zone_assignments za
      WHERE za.user_id = target_user_id
      AND (
        za.branch_id = target_branch_id
        OR (za.zone_id = target_zone_id AND za.branch_id IS NULL)
      )
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
