export type User = {
  id: string;
  email: string;
  name: string;
  role?: string;
  companyId: string;
  branchId?: string | null;
};

const generateId = (): string => `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createUser = (payload: Omit<User, "id">): User => ({
  id: generateId(),
  ...payload,
});
