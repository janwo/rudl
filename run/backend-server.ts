// Run backend server.
require("../server/app/Hapi").hapiServer().catch((err: any) => console.error(err));
