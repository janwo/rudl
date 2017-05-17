import {Config} from "../../../run/config";
import {User} from "../models/user/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {AuthController} from "../controllers/AuthController";
import {AccountController} from "../controllers/AccountController";
import * as Boom from "boom";
import * as faker from "faker";
import {DatabaseManager, TransactionSession} from '../Database';
import {UserAuthProvider} from '../models/user/UserAuthProvider';
import * as Uuid from "uuid";

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
export function handleGoogle(request: any, reply: any): void {
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
		// Create User?
		return user ? user : AccountController.availableUsername(transaction, profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then((username: string) => {
			return AccountController.create(transaction, {
				id: Uuid.v4(),
				firstName: profile.name.given_name,
				lastName: profile.name.family_name,
				username: username,
				password: AuthController.hashPassword(faker.internet.password(10)),
				mail: profile.email
			});
		});
	}).then((user: User) => Promise.all([
		AuthController.addAuthProvider(transaction, user.username, provider),
		AuthController.signToken(user)
	]));
	
	transactionSession.finishTransaction(promise).then((values: [void, string]) => {
		reply.view('message', {
			title: 'Authentication',
			domain: Config.backend.domain,
			token: values[1],
			type: Config.frontend.messageTypes.oauth
		}).header("Authorization", values[1]);
	}).catch((err: any) => {
		reply(Boom.badRequest(err));
	});
}
