import {mongoClient} from "../../config/Database";
import * as Joi from "joi";

export class UserRoles {
	static user = 'user';
	static admin = 'admin';
}

export const Validation = {
	username: Joi.string().min(5).max(16).regex(/^[a-z0-9-_\s]*$/).required(),
	mail: Joi.string().email().required(),
	password: Joi.string().min(6).max(32).required(),
	firstName: Joi.string().min(1).max(24),
	lastName: Joi.string().min(1).max(24)
};

export interface IUserProvider {
	provider: string;
	userIdentifier: string;
	accessToken: string;
	refreshBefore: number;
	refreshToken: string;
}

export const UserProvider = new mongoClient.Schema({
	provider: {type: String, required: true},
	userIdentifier: {type: String, required: true},
	accessToken: {type: String, required: true},
	refreshBefore: {type: Number, default: null}
});

export interface IUser extends mongoClient.Document {
	id?: string | number;
	firstName: string;
	lastName: string;
	username: string;
	mails: {
		primary: string;
		secondary: string;
	};
	scope: [string];
	location: string;
	meta: any;
	auth: {
		password: string;
		providers: [IUserProvider];
	};
	createdAt: number;
	updatedAt: number;
}

export const User = mongoClient.model<IUser>('User', new mongoClient.Schema({
	firstName: {type: String, default: null},
	lastName: {type: String, default: null},
	username: {type: String, lowercase: true, required: true, index: true, unique: true},
	mails: {
		primary: {type: String, required: true, unique: true},
		secondary: {type: String, default: null}
	},
	scope: {type: [String], default: [UserRoles.user]},
	meta: {type: Array, default: []},
	location: {type: String, default: null},
	auth: {
		password: {type: String, required: true},
		providers: {type: [UserProvider], default: null}
	}
}, {
	timestamps: {
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	}
}));
