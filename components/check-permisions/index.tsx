import { useStore } from "@/store";

interface RoleGuardProps {
    roles: string[];
    children: React.ReactNode;
}

function RoleGuard({ roles, children }: RoleGuardProps) {
    const role = useStore((s) => s.role);
    console.log('RoleGuard check:', { role, roles });
    if (!role || !roles.includes(role)) return null;

    return children;
}
export default RoleGuard;