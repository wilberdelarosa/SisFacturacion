import { getHealth } from "../../../../application/use-cases/getHealth";

export const billingHealthRoute = {
  method: "GET" as const,
  url: "/health",
  handler: async () => getHealth()
};
