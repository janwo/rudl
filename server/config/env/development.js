"use strict";
module.exports = {
    app: {
        title: 'eat-together - Development Environment'
    },
    db: {
        mongo: {
            host: process.env.MONGO_HOST || 'localhost',
            port: process.env.MONGO_PORT || 27017,
            database: process.env.MONGO_DB || 'eattogether',
            user: process.env.MONGO_USER || 'eattogether',
            password: process.env.MONGO_PASSWORD || 'eattogether'
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        }
    },
    log: {
        serverLogs: {
            enabled: true,
            options: {}
        },
        databaseLogs: {
            redis: true,
            mongo: true
        }
    },
    providers: {
        facebook: {
            password: process.env.FACEBOOK_PASSWORD,
            clientID: process.env.FACEBOOK_ID || 'APP_ID',
            clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
            callbackURL: '/api/login/facebook'
        },
        twitter: {
            password: 'oqbK@by0%#uoqbfdfby0%#uoqbK@by0%#u',
            clientID: process.env.TWITTER_ID || 'cVJWo8A0jf3WyG0ufbmDXVXwN',
            clientSecret: process.env.TWITTER_SECRET || 'vTyr3SLCUJU2EIEa3h9ZADZLh2ZUkomsmk1liSnG8649qnyIgo',
            callbackURL: '/api/login/twitter'
        },
        google: {
            password: process.env.GOOGLE_PASSWORD,
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
//# sourceMappingURL=development.js.map