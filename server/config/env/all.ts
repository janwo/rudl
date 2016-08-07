export = {
  app: {
    title: 'eat-together'
  },
  port: process.env.PORT || 3000,
  jwt: {
    expiresIn: 60 * 60 * 24 * 50,
    salt: process.env.SALT_JWT
  },
  log: {
    serverLogs: {
      enabled: true,
      options: {}
    },
    databaseLogs: {
      redis: false,
      mongo: true
    }
  }
};
