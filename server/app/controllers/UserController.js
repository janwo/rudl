"use strict";
const Boom = require("boom");
const Uuid = require("node-uuid");
const dot = require("dot-object");
const bcrypt = require('bcrypt');
const Joi = require("joi");
const Config_1 = require("../../config/Config");
const User_1 = require("../models/User");
const Database_1 = require("../../config/Database");
const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
/**
 * Handles [GET] /api/users/me
 * @param request Request-Object
 * @param reply Reply-Object
 */
function me(request, reply) {
    let user = request.auth.credentials;
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
    let user = request.params.username;
    let promise = findByUsername(user).then((user) => {
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
 * Handles [GET] /api/sign_out
 * @param request Request-Object
 * @param reply Reply-Object
 */
function signOut(request, reply) {
    let promise = unsignToken(request.auth.credentials.token);
    reply.api(promise);
}
exports.signOut = signOut;
/**
 * Handles [POST] /api/sign_up
 * @param request Request-Object
 * @param reply Reply-Object
 */
function signUp(request, reply) {
    let promise = createUser({
        username: request.payload.username,
        mail: request.payload.mail,
        password: request.payload.password,
        firstName: request.payload.firstname,
        lastName: request.payload.lastname
    }).then(user => user.save()).then((user) => signToken(user)).then(token => {
        return {
            token: token
        };
    });
    reply.api(promise);
}
exports.signUp = signUp;
/**
 * Handles [POST] /api/sign_in
 * @param request Request-Object
 * @param reply Reply-Object
 */
function signIn(request, reply) {
    let user = request.auth.credentials;
    let promise = signToken(user).then(token => {
        return {
            token: token
        };
    });
    reply.api(promise);
}
exports.signIn = signIn;
function createUser(recipe) {
    return new Promise((resolve, reject) => {
        Joi.validate(recipe, {
            username: User_1.Validation.username,
            password: User_1.Validation.password,
            mail: User_1.Validation.mail,
            firstName: User_1.Validation.firstName,
            lastName: User_1.Validation.lastName,
        }, (err, value) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(value);
        });
    }).then(() => {
        return Promise.all([
            findByUsername(recipe.username),
            findByMail(recipe.mail)
        ]).then((values) => {
            let taken = values.reduce((previousValue, currentValue) => {
                return previousValue || currentValue !== null;
            }, false);
            if (taken)
                return Promise.reject(Boom.badRequest('Cannot create user as the username or mail is already in use.'));
        });
    }).then(() => new User_1.User({
        firstName: recipe.firstName,
        lastName: recipe.lastName,
        username: recipe.username,
        mails: {
            primary: recipe.mail
        },
        scope: [
            User_1.UserRoles.user
        ]
    })).then(user => setPassword(user, recipe.password));
}
exports.createUser = createUser;
/**
 * Handles [POST] /api/check_username
 * @param request Request-Object
 * @param reply Reply-Object
 */
function checkUsername(request, reply) {
    let promise = recommendUsername(request.payload.username);
    reply.api(promise);
}
exports.checkUsername = checkUsername;
function recommendUsername(username) {
    return new Promise((resolve, reject) => {
        //TODO The recommendation array does return strings greater than 16 chars.
        // Check validity.
        if (!Joi.validate(username, User_1.Validation.username)) {
            reject(Boom.badRequest('Username has an invalid length or unexpected characters.'));
            return;
        }
        resolve(User_1.User.find({ username: { $regex: `^${username}[0-9]*$` } }).exec().then((users) => {
            return users.map(user => {
                return user.username;
            });
        }).then((takenUsernames) => {
            let usernameCheckResult = {
                username: username,
                available: takenUsernames.length == 0 || takenUsernames.indexOf(username) < 0
            };
            if (!usernameCheckResult.available) {
                // Add recommendations.
                usernameCheckResult.recommendations = [];
                let pad = (num) => {
                    let padNum = num.toString();
                    while (padNum.length < 2)
                        padNum = "0" + padNum;
                    return padNum;
                };
                /*
                 Method 1 - Append a number.
                 Method 2 - Append a number with pad.
                 */
                let methods = [
                    `${username}#`,
                    `${username}##`
                ];
                methods.forEach(method => {
                    let counter = 2;
                    while (true) {
                        let suggestion = method.replace('##', pad(counter)).replace('#', counter.toString());
                        if (takenUsernames.indexOf(suggestion) < 0) {
                            usernameCheckResult.recommendations.push(suggestion);
                            break;
                        }
                        counter++;
                    }
                });
            }
            return usernameCheckResult;
        }));
    });
}
exports.recommendUsername = recommendUsername;
function setPassword(user, password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password ? password : randomstring.generate(10), 10, (err, hash) => {
            if (err) {
                reject(err);
                return;
            }
            user.auth.password = hash;
            resolve(user);
        });
    });
}
exports.setPassword = setPassword;
function getUserDataCache(userId) {
    return new Promise((resolve, reject) => {
        // Retrieve user in redis.
        let redisKey = `user-${userId}`;
        Database_1.redisClient.get(redisKey, (err, reply) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(reply ? JSON.parse(reply) : {
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
        let redisKey = `user-${userDataCache.userId}`;
        Database_1.redisClient.set(redisKey, JSON.stringify(userDataCache), err => {
            if (err) {
                reject(err);
                return;
            }
            resolve(userDataCache);
        });
    });
}
exports.saveUserDataCache = saveUserDataCache;
function getTokenData(token) {
    return getUserDataCache(token.userId).then((userDataCache) => {
        // Remove old keys.
        userDataCache.tokens = userDataCache.tokens.filter((tokenItem) => {
            return tokenItem.expiresAt > Date.now();
        });
        // Search token.
        let foundTokenData = null;
        for (let i = 0; i < userDataCache.tokens.length; i++) {
            let tokenData = userDataCache.tokens[i];
            if (tokenData.tokenId != token.tokenId)
                continue;
            tokenData.expiresAt = Date.now() + Config_1.Config.jwt.expiresIn;
            foundTokenData = tokenData;
        }
        // Save changes.
        return saveUserDataCache(userDataCache).then(() => foundTokenData);
    });
}
exports.getTokenData = getTokenData;
function signToken(user) {
    // Define token.
    let token = {
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
        return userDataCache;
    }).then(saveUserDataCache).then(() => {
        return new Promise((resolve, reject) => {
            // Sign web token.
            jwt.sign(token, Config_1.Config.jwt.salt, {
                algorithm: 'HS256'
            }, (err, token) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(token);
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
                resolve(userDataCache);
                return;
            }
            reject(Boom.badRequest('Token is invalid.'));
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
        User_1.User.findOne({ username: username }, (err, user) => {
            // If no password was given or no user was found, return (empty) result immediately.
            if (!password || !user)
                return resolve(user);
            // Check password.
            bcrypt.compare(password, user.auth.password, (err, isMatch) => {
                if (err || !isMatch) {
                    reject(Boom.badRequest('Combination of username and password does not match.'));
                    return;
                }
                resolve(user);
            });
        });
    });
}
exports.findByUsername = findByUsername;
function findByMail(mail) {
    return Promise.resolve(User_1.User.findOne({
        'mails.primary': mail
    }).exec());
}
exports.findByMail = findByMail;
function findByToken(token) {
    return getTokenData(token).then((tokenData) => User_1.User.findOne({
        _id: token.userId
    }).exec());
}
exports.findByToken = findByToken;
function addProvider(user, provider, save = false) {
    return new Promise(resolve => {
        let existingProviderIndex = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
        if (existingProviderIndex >= 0)
            user.auth.providers[existingProviderIndex] = provider;
        else
            user.auth.providers.push(provider);
        return resolve(save ? user.save() : user);
    });
}
exports.addProvider = addProvider;
function removeProvider(user, provider, save = false) {
    return new Promise(resolve => {
        let existingProviderIndex = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
        if (existingProviderIndex >= 0)
            user.auth.providers.splice(existingProviderIndex, 1);
        return resolve(save ? user.save() : user);
    });
}
exports.removeProvider = removeProvider;
//# sourceMappingURL=UserController.js.map