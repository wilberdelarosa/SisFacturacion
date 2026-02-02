import { getHealth } from "../../../../application/use-cases/getHealth";

export const identityHealthRoute = {
  method: "GET" as const,
  path: "/health",
  handler: () => getHealth()
};
