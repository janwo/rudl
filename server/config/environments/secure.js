"use strict";
module.exports = {
    app: {
        title: 'eat-together - Development Environment'
    },
    port: 8443,
    passphrase: process.env.SSL_PASSWORD || 'password',
    db: {
        mongo: {
            host: process.env.MONGO_HOST || 'localhost',
            port: process.env.MONGO_PORT || 5432,
            database: process.env.MONGO_DB || 'development',
            user: process.env.MONGO_USER || 'hanx',
            password: process.env.MONGO_PASSWORD || 'password'
        },
        redis: {
            host: process.env.MONGO_HOST || 'localhost',
            port: process.env.MONGO_PORT || 27017,
            database: process.env.MONGO_DB || 'eattogether',
            user: process.env.MONGO_USER || 'eattogether',
            password: process.env.MONGO_PASSWORD || 'eattogether'
        }
    },
    log: {
        serverLogs: {
            console: false,
            file: true
        },
        databaseLogs: {
            redis: false,
            mongo: false
        }
    },
    providers: {
        facebook: {
            clientID: process.env.FACEBOOK_ID || 'APP_ID',
            clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
            callbackURL: '/api/login/facebook'
        },
        twitter: {
            clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
            clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
            callbackURL: '/api/login/twitter'
        },
        google: {
            clientID: process.env.GOOGLE_ID || 'APP_ID',
            clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
            callbackURL: '/api/login/google'
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
//# sourceMappingURL=secure.js.map