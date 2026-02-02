import { getHealth } from "../../../../application/use-cases/getHealth";

export const masterDataHealthRoute = {
  method: "GET" as const,
  path: "/health",
  handler: () => getHealth()
};
