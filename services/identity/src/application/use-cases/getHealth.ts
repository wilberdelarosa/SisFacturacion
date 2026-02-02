export const getHealth = () => ({
  service: "identity",
  status: "ok",
  timestamp: new Date().toISOString()
});
