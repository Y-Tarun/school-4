import type { ReactNode } from 'react';
import { useAppSelector } from '../redux/hooks';

interface RoleGateProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

const permissionMap: Record<string, string[]> = {
  admin: ['students:read', 'students:write', 'students:archive', 'fees:read', 'fees:write', 'staff:read', 'staff:write', 'staff:archive', 'id_cards:generate', 'gallery:write'],
  teacher: ['students:read', 'students:write', 'fees:read', 'staff:read'],
  caretaker: ['students:read', 'staff:read'],
  driver: ['students:read', 'staff:read'],
};

const RoleGate = ({ permissions, children, fallback = null }: RoleGateProps) => {
  const roles = useAppSelector((state) => state.auth.user?.roles || []);
  const allowed = permissions.some((permission) => roles.some((role) => permissionMap[role]?.includes(permission)));
  return allowed ? children : fallback;
};

export default RoleGate;
