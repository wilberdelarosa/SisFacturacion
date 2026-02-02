export type Customer = {
  id: string;
  name: string;
  contactEmail: string;
};

export const createCustomer = (payload: Omit<Customer, "id">): Customer => ({
  id: `${payload.name}-${Date.now()}`,
  ...payload
});
