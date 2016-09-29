import {Config} from "../../config/Config";
import {User, UserProvider} from "../models/User";
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";
import {staticAssets} from "../routes/StaticRoutes";
import UserController = require("../controllers/UserController");
import Boom = require("boom");

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'facebook',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'facebook',
		password: Config.providers.facebook.password,
		clientId: Config.providers.facebook.clientID,
		clientSecret: Config.providers.facebook.clientSecret,
		isSecure: process.env.NODE_ENV === 'secure'
	}
};

/**
 * Controller handling [POST, GET] /api/login/facebook
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleFacebook(request, reply): void {
	// Authenticated successful?
	if (!request.auth.isAuthenticated) reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));
	
	let profile = request.auth.credentials.profile;
	
	// Create provider.
	let provider: UserProvider = {
		provider: StrategyConfig.strategyConfig.provider,
		userIdentifier: profile.id,
		accessToken: request.auth.credentials.token,
		refreshBefore: request.auth.credentials.expiresIn ? request.auth.credentials.expiresIn + Math.trunc(Date.now() / 1000) : null,
		refreshToken: request.auth.credentials.refreshToken || undefined
	};
	
	UserController.findByProvider(provider).then((user: User) => {
		// Found? Done!
		if (user) return Promise.resolve(user);
		
		// Create User.
		return UserController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
			if (checkResults.available) return checkResults.username;
			return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
		}).then(username => {
			return UserController.createUser({
				firstName: profile.name.first,
				lastName: profile.name.last,
				username: username,
				mail: profile.email || profile.id + '@facebook.com'
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
