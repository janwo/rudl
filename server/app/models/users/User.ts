import * as Joi from "joi";
import {Document} from "../Document";

export class UserRoles {
	static user = 'user';
	static admin = 'admin';
}

export const UserValidation = {
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

export interface UserMeta {
	profileText: string;
	hasAvatar: boolean;
}

export interface User extends Document {
	firstName: string;
	lastName: string;
	username: string;
	mails: Array<UserMail>;
	scope: Array<string>;
	location: Array<number>;
	auth: {
		password: string;
		providers: Array<UserProvider>;
	};
	meta: UserMeta;
}
