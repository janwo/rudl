import {Config} from "../../../run/config";
import {User, UserProvider} from "../models/user/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {UserController} from "../controllers/UserController";
import {AuthController} from "../controllers/AuthController";
import {AccountController} from "../controllers/AccountController";
import * as Boom from "boom";
import * as faker from "faker";

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'facebook',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'facebook',
		password: Config.backend.providers.facebook.password,
		clientId: Config.backend.providers.facebook.clientID,
		clientSecret: Config.backend.providers.facebook.clientSecret,
		isSecure: Config.env === 'secure'
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
	
	let profile = request.auth.credentials.profile;
	
	// Create provider.
	let provider: UserProvider = {
		provider: StrategyConfig.strategyConfig.provider,
		userIdentifier: profile.id,
		accessToken: request.auth.credentials.token,
		refreshBefore: request.auth.credentials.expiresIn ? Math.trunc(request.auth.credentials.expiresIn + Date.now() / 1000) : null,
		refreshToken: request.auth.credentials.refreshToken || undefined
	};
	
	UserController.findByProvider(provider).then((user: User) => {
		// Create User?
		debugger
		if(!user) return AccountController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
			if (checkResults.available) return checkResults.username;
			return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
		}).then(username => {
			return AccountController.createUser({
				firstName: profile.name.first,
				lastName: profile.name.last,
				username: username,
				password: faker.internet.password(10),
				mail: profile.email || profile.id + '@facebook.com'
			});
		});
		return user;
	}).then((user: User) => AccountController.addProvider(user, provider)).then(user => AccountController.save(user)).then(user => AuthController.signToken(user)).then(token => {
		reply.view('message', {
			title: 'Authentication',
			domain: Config.backend.domain,
			token: token,
			type: Config.frontend.messageTypes.oauth,
			message: token
		}).header("Authorization", token);
	}).catch(err => {
		reply(Boom.badRequest(err));
	});
}
