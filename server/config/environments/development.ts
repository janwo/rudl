export = {
	app: {
		title: 'eat-together - Development Environment'
	},
	db: {
		redis: {
			host: process.env.REDIS_HOST || 'localhost',
			port: process.env.REDIS_PORT || 6379
		},
		arango: {
			host: process.env.ARANGO_HOST || 'localhost',
			port: process.env.ARANGO_PORT || 8529,
			database: process.env.ARANGO_DB || 'meal2share',
			user: process.env.ARANGO_USER || 'meal2share',
			password: process.env.ARANGO_PASSWORD || 'meal2share'
		}
	},
	log: {
		serverLogs: {
			console: true,
			file: false
		},
		databaseLogs: {
			redis: true
		}
	},
	providers: {
		facebook: {
			password: process.env.FACEBOOK_PASSWORD,
			clientID: process.env.FACEBOOK_ID,
			clientSecret: process.env.FACEBOOK_SECRET,
			callbackURL: '/oauth/facebook'
		},
		twitter: {
			password: 'oqbK@by0%#uoqbfdfby0%#uoqbK@by0%#u',
			clientID: process.env.TWITTER_ID || 'cVJWo8A0jf3WyG0ufbmDXVXwN',
			clientSecret: process.env.TWITTER_SECRET || 'vTyr3SLCUJU2EIEa3h9ZADZLh2ZUkomsmk1liSnG8649qnyIgo',
			callbackURL: '/oauth/twitter'
		},
		google: {
			password: process.env.GOOGLE_PASSWORD,
			clientID: process.env.GOOGLE_ID || '368340288629-nf8puh782soi68a3udusucbn1nh81sk2.apps.googleusercontent.com',
			clientSecret: process.env.GOOGLE_SECRET || '32pv9JsPuA3mNzYXiF4qevyy',
			callbackURL: '/oauth/google'
		}
	},
	mailer: {
		from: process.env.MAILER_FROM || 'MAILER_FROM',
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
			auth: {
				user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
				pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
			}
		}
	}
};
