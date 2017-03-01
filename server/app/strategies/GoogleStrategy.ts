import {Config} from "../../../run/config";
import {UserProvider, User} from "../models/users/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {UserController} from "../controllers/UserController";
import Boom = require("boom");
import randomstring = require("randomstring");
import {AuthController} from "../controllers/AuthController";
import {AccountController} from "../controllers/AccountController";

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'google',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'google',
		password: Config.backend.providers.google.password,
		clientId: Config.backend.providers.google.clientID,
		clientSecret: Config.backend.providers.google.clientSecret,
		isSecure: Config.env === 'secure'
	}
};

/**
 * Controller handling [POST, GET] /api/login/google
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleGoogle(request, reply): void {
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
	
	UserController.findByProvider(provider).catch((err: Error) => {
		// Create User.
		return AccountController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
			if (checkResults.available) return checkResults.username;
			return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
		}).then(username => {
			return AccountController.createUser({
				firstName: profile.name.given_name,
				lastName: profile.name.family_name,
				username: username,
				password: randomstring.generate(10),
				mail: profile.email
			});
		});
	}).then((user: User) => AccountController.addProvider(user, provider)).then(AccountController.saveUser).then(AuthController.signToken).then(token => {
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
