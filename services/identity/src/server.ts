import { registeredRoutes } from "./adapters/inbound/http/server";

export const startIdentityService = () => ({
  name: "identity",
  registeredRoutes
});
