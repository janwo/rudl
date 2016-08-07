import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import bcrypt = require('bcrypt');
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Config} from "../../config/Config";
import {User, IUser, IUserProvider} from "../models/User";
import {redisClient} from "../../config/Database";
import {DecodedToken, UserDataCache, TokenData} from "../models/Token";

/**
 * Handles [GET] /api/users/me
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function me(request : any, reply : any) : void {
    var user = request.auth.credentials;
    reply({
        user: user
    });
}


/**
 * Handles [GET] /api/users/{username}
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function getUser(request : any, reply : any) : void {
    var user = request.params.username;
    findByUsername(user).then(user => {
        if(!user) return reply(Boom.notFound('User not found.'));
        reply(dot.transform({
            id : "id",
            username: "username",
            firstName: "firstName",
            lastName: "lastName",
            createdAt: "createdAt"
        }, user));
    }).catch(err => {
        return reply(Boom.badRequest(err));
    });
}

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
export function signOut(request, reply) {
    unsignToken(request.auth.credentials.token).then(() => {

    });
}

export function signUpWithProvider(request : any, reply : any, provider : IUserProvider) : void {

}

export function signInWithProvider(request : any, reply : any, username : string, provider : any) : void {

}

export function signUp(request : any, reply : any, username : string, provider : any) : void {

}

export function signIn(request : any, reply : any, username : string, provider : any) : void {

}

export function createRandomPassword (user : IUser, save : boolean = false) : Promise<IUser> {
    return new Promise((resolve, reject) => {
        var password : string = randomstring.generate(10);
        bcrypt.hash(password, 10, (err, hash) => {
            if(err) return reject(err);

            user.auth.password = hash;
            resolve(save ? user.save() : user);
        });
    });
}

export function getUserDataCache(userId : number | string) : Promise<UserDataCache> {
    return new Promise((resolve, reject) => {
        // Retrieve user in redis.
        var redisKey : string = `user-${userId}`;
        redisClient.get(redisKey, (err, reply) => {
            if (err) return reject(err);
            return resolve(reply ? JSON.parse(reply) : {
                userId: userId,
                tokens: []
            });
        });
    });
}

export function saveUserDataCache(userDataCache : UserDataCache) : Promise<UserDataCache> {
    return new Promise((resolve, reject) => {
        // Retrieve user in redis.
        var redisKey : string = `user-${userDataCache.userId}`;
        redisClient.set(redisKey, JSON.stringify(userDataCache), err => {
            if (err) return reject(err);
            return resolve(userDataCache);
        });
    });
}

export function getTokenData(token : DecodedToken) : Promise<TokenData> {
    return getUserDataCache(token.userId).then((userDataCache: UserDataCache) => {
        // Save changes.
        return new Promise((resolve, reject) => {
            // Remove old keys.
            userDataCache.tokens = userDataCache.tokens.filter((tokenItem:TokenData) => {
                return tokenItem.expiresAt > Date.now();
            });

            // Search token.
            let foundTokenData : TokenData = null;
            for(let i = 0; i < userDataCache.tokens.length; i++) {
                var tokenData : TokenData = userDataCache.tokens[i];
                if(tokenData.tokenId != token.tokenId) continue;
                tokenData.expiresAt = Date.now() + Config.jwt.expiresIn;
                foundTokenData = tokenData;
            }

            // Save changes.
            saveUserDataCache(userDataCache).then(() => resolve(foundTokenData)).catch(err => reject(err));
        });
    });
}

export function signToken(user : IUser) : Promise<String> {
    // Define token.
    var token : DecodedToken = {
        tokenId: Uuid.v4(),
        userId: user.id
    };

    return getUserDataCache(user.id).then((userDataCache : UserDataCache) => {
        // Add token.
        userDataCache.tokens.push({
            tokenId: token.tokenId,
            deviceName: 'Device', // TODO
            createdAt: Date.now(),
            expiresAt: Date.now() + Config.jwt.expiresIn
        });
        return Promise.resolve(userDataCache);

    }).then(saveUserDataCache).then((userDataCache : UserDataCache) => {
        return new Promise((resolve, reject) => {
            // Sign web token.
            jwt.sign(token, Config.jwt.salt, {
                algorithm: 'HS256'
            }, (err, token) => {
                if(err) return reject(err);
                return resolve(token);
            });
        });
    });
}

export function unsignToken(token : DecodedToken) : Promise<UserDataCache> {
    return getUserDataCache(token.userId).then((userDataCache : UserDataCache) => {
        return new Promise((resolve, reject) => {
            for(let i = 0; i < userDataCache.tokens.length; i++) {
                let tokenItem = userDataCache.tokens[i];
                if(tokenItem.tokenId != token.tokenId) continue;

                tokenItem.expiresAt = Date.now(); // Expire.
                return resolve(userDataCache);
            }
            reject(new Error('Token is invalid.'));
        }).then(saveUserDataCache);
    });
}

export function findByProvider(provider : IUserProvider) : Promise<IUser> {
    return Promise.resolve(User.findOne({
        $and: [
            {'auth.providers.provider': provider.provider},
            {'auth.providers.userIdentifier': provider.userIdentifier}
        ]
    }).exec());
}

export function findByUsername(username : string, password : string | boolean = false) : Promise<IUser> {
    return new Promise((resolve, reject) => {
        User.findOne({username: username}).exec().then((user : IUser) => {
            // If no password was given or no user was found, return (empty) result immediately.
            if (!password || !user) return resolve(user);

            // Check password.
            bcrypt.compare(password, user.auth.password, (err, isMatch) => {
                if(err || !isMatch) return Promise.reject(new Error('Combination of username and password does not match.'));
                return resolve(user);
            });
        }, err => {
            return reject(err);
        });
    });
}

export function findByToken(token : DecodedToken) : Promise<IUser> {
    return getTokenData(token).then((tokenData : TokenData) => {
        return Promise.resolve(User.findOne({_id: token.userId}).exec());
    });
}

export function addProvider(user: IUser, provider : IUserProvider, save : boolean = false) : Promise<IUser> {
    var existingProviderIndex : number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
    if(existingProviderIndex >= 0)
        user.auth.providers[existingProviderIndex] = provider;
    else
        user.auth.providers.push(provider);
    return Promise.resolve(save ? user.save() : user);
}

export function removeProvider(user: IUser, provider : IUserProvider, save : boolean = false) : Promise<IUser> {
    var existingProviderIndex : number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
    if(existingProviderIndex >= 0)
        user.auth.providers.splice(existingProviderIndex, 1);
    else
        return Promise.resolve(user);
    return Promise.resolve(save ? user.save() : user);
}
