import { User, Role, UserActivity, Permission } from '@/types/users';
import { faker } from '@faker-js/faker';

export const permissions: Permission[] = [
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'users.manage_roles',
  'reports.view',
  'reports.export',
  'settings.view',
  'settings.edit',
];

export const roles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    nameAr: 'مدير',
    description: 'Full system access',
    permissions: permissions,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Manager',
    nameAr: 'مدير تنفيذي',
    description: 'Manage users and view reports',
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'reports.view',
      'reports.export',
    ],
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'User',
    nameAr: 'مستخدم',
    description: 'Basic access',
    permissions: [
      'users.view',
    ],
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const generateMockUsers = (): User[] => {
  const users: User[] = [];
  const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending'];
  const roles: ('admin' | 'manager' | 'user')[] = ['admin', 'manager', 'user'];

  for (let i = 0; i < 50; i++) {
    const createdAt = faker.date.past();
    users.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(roles),
      status: faker.helpers.arrayElement(statuses),
      avatar: faker.image.avatar(),
      company: faker.company.name(),
      createdAt: createdAt.toISOString(),
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
      lastLoginAt: faker.date.recent().toISOString(),
      lastActivityAt: faker.date.recent().toISOString(),
    });
  }

  return users;
};

export const mockUsers: User[] = generateMockUsers();

export const mockUserActivities: UserActivity[] = mockUsers.slice(0, 10).map((user) => ({
  id: faker.string.uuid(),
  userId: user.id,
  action: faker.helpers.arrayElement(['login', 'logout', 'update_profile', 'create_shipment', 'view_report']),
  description: faker.lorem.sentence(),
  ipAddress: faker.internet.ip(),
  userAgent: faker.internet.userAgent(),
  createdAt: faker.date.recent().toISOString(),
}));

let usersStore = [...mockUsers];

export const getUsers = () => usersStore;

export const setUsers = (users: User[]) => {
  usersStore = users;
};
