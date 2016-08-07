import {Config} from "../../config/Config";
import {DecodedToken} from "../models/Token";
import UserController = require("../controllers/UserController");

export var StrategyConfig = {
    strategyName: 'jwt',
    schemeName: 'jwt',
    strategyConfig: {
        validateFunc: (decodedToken : DecodedToken, request, callback) => {
            UserController.findByToken(decodedToken).then(user => {
                if(!user) return callback(new Error('Token is invalid.'), false);
                return callback(null, true, user);
            }).catch(err => {
                return callback(err, false);
            })
        },
        verifyOptions: {
            algorithms: ['HS256'],
            ignoreExpiration: true
        },
        key: Config.jwt.salt
    }
};
