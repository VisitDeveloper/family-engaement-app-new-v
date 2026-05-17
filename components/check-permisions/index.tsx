import { useEffectiveRole } from "@/hooks/use-effective-role";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

function RoleGuard({ roles, children }: RoleGuardProps) {
  const effectiveRole = useEffectiveRole();
  if (!effectiveRole || !roles.includes(effectiveRole)) return null;

  return children;
}

export default RoleGuard;
