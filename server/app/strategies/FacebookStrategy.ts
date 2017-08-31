import {Config} from '../../../run/config';
import {User} from '../models/user/User';
import {StrategyConfiguration} from '../binders/StrategiesBinder';
import {AuthController} from '../controllers/AuthController';
import {AccountController} from '../controllers/AccountController';
import * as Boom from 'boom';
import * as faker from 'faker';
import {TransactionSession} from '../DatabaseManager';
import {UserAuthProvider} from '../models/user/UserAuthProvider';
import * as shortid from 'shortid';
import {MailManager, WelcomeMailOptions} from '../MailManager';
import {MonitorManager} from "../MonitorManager";
import {Counter} from "prom-client";

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'facebook',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'facebook',
		password: Config.backend.providers.facebook.password,
		clientId: Config.backend.providers.facebook.clientID,
		clientSecret: Config.backend.providers.facebook.clientSecret,
		isSecure: Config.backend.ssl
	}
};

/**
 * Controller handling [POST, GET] /api/login/facebook
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleFacebook(request: any, reply: any): void {
	// Authenticated successful?
	if (!request.auth.isAuthenticated) reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));

	let profile: any = request.auth.credentials.profile;
	
	// Create provider.
	let provider: UserAuthProvider = {
		provider: StrategyConfig.strategyConfig.provider,
		identifier: profile.id,
		accessToken: request.auth.credentials.token,
		refreshBefore: request.auth.credentials.expiresIn ? Math.trunc(request.auth.credentials.expiresIn + Date.now() / 1000) : null,
		refreshToken: request.auth.credentials.refreshToken || undefined
	};

	// Start transaction.
	let transactionSession = new TransactionSession();
	let transaction = transactionSession.beginTransaction();
	let promise = AuthController.authByProvider(provider).then((user: User) => {
		// Create User? Return mail options, if not.
		return user ? {
			mail: null,
			user: user
		} : AccountController.availableUsername(transaction, profile.displayName.toLowerCase()).then((username: string) => {
			return AccountController.create(transaction, {
				id: shortid.generate(),
				firstName: profile.name.first,
				lastName: profile.name.last,
				username: username,
				password: AuthController.hashPassword(faker.internet.password(10)),
				mail: profile.email || profile.id + '@facebook.com'
			}).then(user => {
			    // Track.
                (MonitorManager.metrics.newUsers as Counter).labels(StrategyConfig.strategyName).inc(1, Date.now());

                // Return mail options.
				return {
					mail: {
						to: user.mail,
						name: user.firstName,
						locale: user.languages.shift(),
						provider: 'Facebook'
					},
					user: user
				};
			});
		});
	}).then((result: {
		mail: WelcomeMailOptions,
		user: User
	}) => Promise.all([
		AuthController.addAuthProvider(transaction, result.user.username, provider),
		AuthController.signToken(result.user),
		result.mail
	]));

	transactionSession.finishTransaction(promise).then((values: [void, string, WelcomeMailOptions]) => {
		if(values[2]) MailManager.sendWelcomeMail(values[2]);
		reply.view('local-storage', {
			title: 'Authentication in Progress...',
			key: Config.backend.jwt.name,
			value: values[1],
			redirectTo: Config.backend.domain
		});
	}, (err: any) => {
        reply(Boom.badRequest(err));
    });
}
