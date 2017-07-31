import {Config} from '../../../run/config';
import {RoutesConfiguration} from '../binders/RoutesBinder';
import {UserRoles, UserValidation} from '../models/user/User';
import {AuthController} from '../controllers/AuthController';
import * as FacebookStrategy from '../strategies/FacebookStrategy';
import * as GoogleStrategy from '../strategies/GoogleStrategy';
import * as Joi from 'joi';

export const RoutesConfig: RoutesConfiguration = {
	name: 'auth-routes',
	routes: [
		{
			path: '/api/sign-up',
			method: 'POST',
			handler: AuthController.RouteHandlers.signUp,
			config: {
				auth: false,
				validate: {
					payload: UserValidation
				}
			}
		},
        {
            path: '/api/sign-in',
            method: 'POST',
            handler: AuthController.RouteHandlers.signIn,
            config: {
                auth: false,
                validate: {
                    payload: {
                        mail: UserValidation.mail,
                        password: UserValidation.password
                    }
                }
            }
        },
        {
            path: '/api/forgot-password',
            method: 'POST',
            handler: AuthController.RouteHandlers.forgotPassword,
            config: {
                auth: false,
                validate: {
                    payload: {
                        mail: UserValidation.mail
                    }
                }
            }
        },
        {
            path: '/api/set-password',
            method: 'POST',
            handler: AuthController.RouteHandlers.setPassword,
            config: {
                auth: false,
                validate: {
                    payload: {
                        mail: UserValidation.mail,
                        password: UserValidation.password,
                        token: Joi.string().required()
                    }
                }
            }
        },
		{
			path: Config.backend.providers.facebook.callbackURL,
			method: ['GET', 'POST'],
			handler: FacebookStrategy.handleFacebook,
			config: {
				auth: {
					strategy: 'facebook'
				}
			}
		},
		{
			path: Config.backend.providers.google.callbackURL,
			method: ['GET', 'POST'],
			handler: GoogleStrategy.handleGoogle,
			config: {
				auth: {
					strategy: 'google'
				}
			}
		},
		{
			path: '/api/sign-out',
			method: 'GET',
			handler: AuthController.RouteHandlers.signOut,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				}
			}
		}
	]
};
