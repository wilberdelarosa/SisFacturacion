export const getHealth = () => ({
  service: "billing",
  status: "ok",
  timestamp: new Date().toISOString()
});
