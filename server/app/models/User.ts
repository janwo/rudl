import * as Joi from "joi";

export class UserRoles {
	static user = 'user';
	static admin = 'admin';
}

export const Validation = {
	username: Joi.string().min(5).max(16).regex(/^[a-z0-9-_]*$/).required(),
	mail: Joi.string().email().required(),
	password: Joi.string().min(6).max(32).required(),
	firstName: Joi.string().min(1).max(24),
	lastName: Joi.string().min(1).max(24)
};

export interface UserProvider {
	provider: string;
	userIdentifier: string;
	accessToken: string;
	refreshBefore: number;
	refreshToken: string;
}

export interface UserMail {
	mail: string;
	verified: boolean;
}

export interface User {
	_id: string;
	_key: string;
	firstName: string;
	lastName: string;
	username: string;
	mails: [UserMail];
	scope: [string];
	location: string;
	meta: any;
	auth: {
		password: string;
		providers: [UserProvider];
	};
	createdAt: number;
	updatedAt: number;
}
