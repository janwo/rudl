import {Config} from "../../../run/config";
import {UserProvider, User} from "../models/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {UserController} from "../controllers/UserController";
import Boom = require("boom");
import {AssetsPool} from "../AssetsPool";

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'twitter',
	schemeName: 'bell',
	strategyConfig: {
		provider: 'twitter',
		password: Config.backend.providers.twitter.password,
		clientId: Config.backend.providers.twitter.clientID,
		clientSecret: Config.backend.providers.twitter.clientSecret,
		isSecure: Config.env === 'secure'
	}
};

/**
 * Controller handling [POST, GET] /api/login/twitter
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleTwitter(request: any, reply: any): void {
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
		// Create the user profile
		let displayName = profile.displayName.trim();
		let iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
		let firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
		let lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';
		
		// Create User.
		return UserController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
			if (checkResults.available) return checkResults.username;
			return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
		}).then(username => {
			return UserController.createUser({
				firstName: firstName,
				lastName: lastName,
				username: username,
				mail: null /* default, Twitter does not return mails in those requests */
			});
		});
	}).then((user: User) => UserController.addProvider(user, provider)).then(UserController.saveUser).then(UserController.signToken).then(token => {
		reply.view('index', {
			title: 'Authentication',
			assets: AssetsPool.getAssets(),
			metas: {
				token: token
			}
		}).header("Authorization", token);
	}).catch(err => {
		reply(Boom.badRequest(err));
	});
}
