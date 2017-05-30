import * as Joi from 'joi';
import {Node} from '../Node';

export class UserRoles {
	static user = 'user';
	static admin = 'admin';
}

export const UserValidation = {
	username: Joi.string().min(5).max(16).trim().regex(/^[a-z0-9_]*$/).required(),
	mail: Joi.string().email().trim().required(),
	password: Joi.string().min(6).max(32).required(),
	firstName: Joi.string().min(1).trim().max(24).required(),
	lastName: Joi.string().min(1).trim().max(24).required()
};

export interface User extends Node {
	firstName: string;
	lastName: string;
	username: string;
	profileText: string;
	hasAvatar: boolean;
	onBoard: boolean;
	id: string;
	scope: Array<string>;
	location: {
		lng: number,
		lat: number,
	};
	languages: Array<string>;
	mails: {
		primary: {
			verified: boolean;
			mail: string;
		},
		secondary: {
			verified: boolean;
			mail: string;
		}
	}
	password: string;
}
