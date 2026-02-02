export type User = {
  id: string;
  email: string;
  name: string;
};

export const createUser = (payload: Omit<User, "id">): User => ({
  id: `${payload.email}-${Date.now()}`,
  ...payload
});
