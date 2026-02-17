import { Badge } from "./Badge";

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case "admin":
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "gerente":
        return "bg-blue-100 text-blue-800";
      case "vendedor":
        return "bg-green-100 text-green-800";
      case "contador":
        return "bg-purple-100 text-purple-800";
      case "operador":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    gerente: "Gerente",
    vendedor: "Vendedor",
    contador: "Contador",
    operador: "Operador",
  };
  const label = roleLabels[role] ?? role.replace(/_/g, " ").toUpperCase();

  return (
    <Badge className={getRoleColor(role)}>
      {label}
    </Badge>
  );
}