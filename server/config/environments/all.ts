export = {
	app: {
		title: 'eat-together'
	},
	port: process.env.PORT || 3000,
	jwt: {
		expiresIn: 1000 * 60 * 60 * 24 * 50,
		deleteIn: 1000 * 60 * 60 * 24 * 30,
		salt: process.env.SALT_JWT
	},
	log: {
		serverLogs: {
			console: false,
			file: false
		},
		databaseLogs: {
			redis: false,
			mongo: true
		}
	}
};
