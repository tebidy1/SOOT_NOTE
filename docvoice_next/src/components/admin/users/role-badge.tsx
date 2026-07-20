import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/users';

interface RoleBadgeProps {
  role: UserRole;
}

const roleConfig = {
  admin: {
    label: 'مدير',
    labelEn: 'Admin',
    className: 'bg-purple-500 hover:bg-purple-600',
  },
  manager: {
    label: 'مدير تنفيذي',
    labelEn: 'Manager',
    className: 'bg-blue-500 hover:bg-blue-600',
  },
  user: {
    label: 'مستخدم',
    labelEn: 'User',
    className: 'bg-gray-500 hover:bg-gray-600',
  },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <Badge className={`${config.className} text-white`}>
      {config.label}
    </Badge>
  );
}
