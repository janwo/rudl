import {Config} from "../../config/Config";
import {UserProvider, User} from "../models/User";
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";
import {staticAssets} from "../routes/StaticRoutes";
import {UserController} from "../controllers/UserController";
import Boom = require("boom");

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'google',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'google',
		password: Config.providers.google.password,
		clientId: Config.providers.google.clientID,
		clientSecret: Config.providers.google.clientSecret,
		isSecure: process.env.NODE_ENV === 'secure'
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
		refreshBefore: request.auth.credentials.expiresIn ? request.auth.credentials.expiresIn + Date.now() / 1000 : null,
		refreshToken: request.auth.credentials.refreshToken || undefined
	};
	
	UserController.findByProvider(provider).catch((err: Error) => {
		// Create User.
		return UserController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
			if (checkResults.available) return checkResults.username;
			return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
		}).then(username => {
			return UserController.createUser({
				firstName: profile.name.given_name,
				lastName: profile.name.family_name,
				username: username,
				mail: profile.email
			});
		});
	}).then((user: User) => UserController.addProvider(user, provider)).then(UserController.saveUser).then(UserController.signToken).then(token => {
		reply.view('index', {
			title: 'Authentication',
			assets: staticAssets,
			metas: {
				token: token
			}
		}).header("Authorization", token);
	}).catch(err => {
		reply(Boom.badRequest(err));
	});
}
