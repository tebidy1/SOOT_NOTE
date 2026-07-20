import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/types/users';

interface UserStatusBadgeProps {
  status: UserStatus;
}

const statusConfig = {
  active: {
    label: 'نشط',
    labelEn: 'Active',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
  },
  inactive: {
    label: 'غير نشط',
    labelEn: 'Inactive',
    variant: 'secondary' as const,
    className: 'bg-gray-500 hover:bg-gray-600',
  },
  pending: {
    label: 'معلق',
    labelEn: 'Pending',
    variant: 'outline' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={`${config.className} text-white`}>
      {config.label}
    </Badge>
  );
}
