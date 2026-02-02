import { registeredRoutes } from "./adapters/inbound/http/server";

export const startMasterDataService = () => ({
  name: "master-data",
  registeredRoutes
});
