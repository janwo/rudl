import {Config} from "../../../run/config";
import {UserProvider, User} from "../models/user/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {UserController} from "../controllers/UserController";
import {AuthController} from "../controllers/AuthController";
import {AccountController} from "../controllers/AccountController";
import * as Boom from "boom";
import * as randomstring from"randomstring";

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
		refreshBefore: request.auth.credentials.expiresIn ? Math.trunc(request.auth.credentials.expiresIn + Date.now() / 1000) : null,
		refreshToken: request.auth.credentials.refreshToken || undefined
	};
	
	UserController.findByProvider(provider).then((user: User) => {
		// Create user?
		if(!user) {
			let displayName = profile.displayName.trim();
			let iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
			let firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
			let lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';
			
			// Create User.
			return AccountController.checkUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
				if (checkResults.available) return checkResults.username;
				return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
			}).then(username => {
				return AccountController.createUser({
					firstName: firstName,
					lastName: lastName,
					password: randomstring.generate(10),
					username: username,
					mail: null /* default, Twitter does not return mails in those requests */
				});
			});
		}
		
		return user;
	}).then((user: User) => AccountController.addProvider(user, provider)).then(user => AccountController.save(user)).then(user => AuthController.signToken(user)).then(token => {
		reply.view('message', {
			title: 'Authentication',
			domain: Config.backend.domain,
			type: Config.frontend.messageTypes.oauth,
			token: token,
			message: token
		}).header("Authorization", token);
	}).catch(err => {
		reply(Boom.badRequest(err));
	});
}
