export const getHealth = () => ({
  service: "master-data",
  status: "ok",
  timestamp: new Date().toISOString()
});
