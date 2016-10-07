import glob = require("glob");

// Set environment variable.
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = 'development';
	console.log(`NODE_ENV is not defined! Set NODE_ENV to "${process.env.NODE_ENV}"...`);
}
console.log(`Server uses "${process.env.NODE_ENV}" environment...`);

// Start Hapi server.
require("./config/Hapi").hapiServer().catch(err => console.error(err));
