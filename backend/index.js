const { startServer } = require("./app");

startServer().catch((error) => {
  console.error("Failed to start backend server:", error);
  process.exit(1);
});
