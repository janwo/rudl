"use strict";
const Boom = require("boom");
const Uuid = require("node-uuid");
const dot = require("dot-object");
const bcrypt = require('bcrypt');
const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const Config_1 = require("../../config/Config");
const User_1 = require("../models/User");
const Database_1 = require("../../config/Database");
/**
 * Handles [GET] /api/users/me
 * @param request Request-Object
 * @param reply Reply-Object
 */
function me(request, reply) {
    var user = request.auth.credentials;
    reply.api(dot.transform({
        id: "id",
        username: "username",
        firstName: "firstName",
        lastName: "lastName",
        createdAt: "createdAt"
    }, user));
}
exports.me = me;
/**
 * Handles [GET] /api/users/{username}
 * @param request Request-Object
 * @param reply Reply-Object
 */
function getUser(request, reply) {
    var user = request.params.username;
    var promise = findByUsername(user).then((user) => {
        if (!user)
            return Promise.reject(Boom.notFound('User not found.'));
        return user;
    }).then((user) => {
        return dot.transform({
            id: "id",
            username: "username",
            firstName: "firstName",
            lastName: "lastName",
            createdAt: "createdAt"
        }, user);
    });
    reply.api(promise);
}
exports.getUser = getUser;
/*
var smtpTransport = Nodemailer.createTransport(Config.mailer.options);
            request.server.render('templates/reset-password-email', {
                name: user.displayName,
                appName: Config.app.title,
                url: 'http://' + request.headers.host + '/auth/reset/' + token
            }, function (err, emailHTML) {

                var mailOptions = {
                    to: user.email,
                    from: Config.mailer.from,
                    subject: 'Password Reset',
                    html: emailHTML
                };
                smtpTransport.sendMail(mailOptions, function (err) {

                    if (!err) {
                        reply({message: 'An email has been sent to ' + user.email + ' with further instructions.'});
                    } else {
                        return reply(Boom.badRequest('Failure sending email'));
                    }

                    done(err);
                });
            });
        },
*/
/*
function (user, done) {
    request.server.render('templates/reset-password-confirm-email', {
        name: user.displayName,
        appName: Config.app.title
    }, function (err, emailHTML) {
         var mailOptions = {
         to: user.email,
         from: Config.mailer.from,
         subject: 'Your password has been changed',
         html: emailHTML
         };

         smtpTransport.sendMail(mailOptions, function (err) {
         done(err, 'done');
         });
    });
*/
/**
 * Handles [GET] /api/logout
 * @param request Request-Object
 * @param reply Reply-Object
 */
function signOut(request, reply) {
    unsignToken(request.auth.credentials.token).then(() => {
        reply.api();
    });
}
exports.signOut = signOut;
function signUpWithProvider(request, reply, provider) {
}
exports.signUpWithProvider = signUpWithProvider;
function signInWithProvider(request, reply, username, provider) {
}
exports.signInWithProvider = signInWithProvider;
function signUp(request, reply, username, provider) {
}
exports.signUp = signUp;
function signIn(request, reply, username, provider) {
}
exports.signIn = signIn;
function createRandomPassword(user, save = false) {
    return new Promise((resolve, reject) => {
        var password = randomstring.generate(10);
        bcrypt.hash(password, 10, (err, hash) => {
            if (err)
                return reject(err);
            user.auth.password = hash;
            resolve(save ? user.save() : user);
        });
    });
}
exports.createRandomPassword = createRandomPassword;
function getUserDataCache(userId) {
    return new Promise((resolve, reject) => {
        // Retrieve user in redis.
        var redisKey = `user-${userId}`;
        Database_1.redisClient.get(redisKey, (err, reply) => {
            if (err)
                return reject(err);
            return resolve(reply ? JSON.parse(reply) : {
                userId: userId,
                tokens: []
            });
        });
    });
}
exports.getUserDataCache = getUserDataCache;
function saveUserDataCache(userDataCache) {
    return new Promise((resolve, reject) => {
        // Retrieve user in redis.
        var redisKey = `user-${userDataCache.userId}`;
        Database_1.redisClient.set(redisKey, JSON.stringify(userDataCache), err => {
            if (err)
                return reject(err);
            return resolve(userDataCache);
        });
    });
}
exports.saveUserDataCache = saveUserDataCache;
function getTokenData(token) {
    return getUserDataCache(token.userId).then((userDataCache) => {
        // Save changes.
        return new Promise((resolve, reject) => {
            // Remove old keys.
            userDataCache.tokens = userDataCache.tokens.filter((tokenItem) => {
                return tokenItem.expiresAt > Date.now();
            });
            // Search token.
            let foundTokenData = null;
            for (let i = 0; i < userDataCache.tokens.length; i++) {
                var tokenData = userDataCache.tokens[i];
                if (tokenData.tokenId != token.tokenId)
                    continue;
                tokenData.expiresAt = Date.now() + Config_1.Config.jwt.expiresIn;
                foundTokenData = tokenData;
            }
            // Save changes.
            saveUserDataCache(userDataCache).then(() => resolve(foundTokenData)).catch(err => reject(err));
        });
    });
}
exports.getTokenData = getTokenData;
function signToken(user) {
    // Define token.
    var token = {
        tokenId: Uuid.v4(),
        userId: user.id
    };
    return getUserDataCache(user.id).then((userDataCache) => {
        // Add token.
        userDataCache.tokens.push({
            tokenId: token.tokenId,
            deviceName: 'Device',
            createdAt: Date.now(),
            expiresAt: Date.now() + Config_1.Config.jwt.expiresIn
        });
        return Promise.resolve(userDataCache);
    }).then(saveUserDataCache).then((userDataCache) => {
        return new Promise((resolve, reject) => {
            // Sign web token.
            jwt.sign(token, Config_1.Config.jwt.salt, {
                algorithm: 'HS256'
            }, (err, token) => {
                if (err)
                    return reject(err);
                return resolve(token);
            });
        });
    });
}
exports.signToken = signToken;
function unsignToken(token) {
    return getUserDataCache(token.userId).then((userDataCache) => {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < userDataCache.tokens.length; i++) {
                let tokenItem = userDataCache.tokens[i];
                if (tokenItem.tokenId != token.tokenId)
                    continue;
                tokenItem.expiresAt = Date.now(); // Expire.
                return resolve(userDataCache);
            }
            reject(new Error('Token is invalid.'));
        }).then(saveUserDataCache);
    });
}
exports.unsignToken = unsignToken;
function findByProvider(provider) {
    return Promise.resolve(User_1.User.findOne({
        $and: [
            { 'auth.providers.provider': provider.provider },
            { 'auth.providers.userIdentifier': provider.userIdentifier }
        ]
    }).exec());
}
exports.findByProvider = findByProvider;
function findByUsername(username, password = false) {
    return new Promise((resolve, reject) => {
        User_1.User.findOne({ username: username }).exec().then((user) => {
            // If no password was given or no user was found, return (empty) result immediately.
            if (!password || !user)
                return resolve(user);
            // Check password.
            bcrypt.compare(password, user.auth.password, (err, isMatch) => {
                if (err || !isMatch)
                    return Promise.reject(new Error('Combination of username and password does not match.'));
                return resolve(user);
            });
        }, err => reject(err));
    });
}
exports.findByUsername = findByUsername;
function findByToken(token) {
    return getTokenData(token).then((tokenData) => {
        return Promise.resolve(User_1.User.findOne({ _id: token.userId }).exec());
    });
}
exports.findByToken = findByToken;
function addProvider(user, provider, save = false) {
    var existingProviderIndex = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
    if (existingProviderIndex >= 0)
        user.auth.providers[existingProviderIndex] = provider;
    else
        user.auth.providers.push(provider);
    return Promise.resolve(save ? user.save() : user);
}
exports.addProvider = addProvider;
function removeProvider(user, provider, save = false) {
    var existingProviderIndex = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
    if (existingProviderIndex >= 0)
        user.auth.providers.splice(existingProviderIndex, 1);
    else
        return Promise.resolve(user);
    return Promise.resolve(save ? user.save() : user);
}
exports.removeProvider = removeProvider;
//# sourceMappingURL=UserController.js.map