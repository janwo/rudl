import * as Joi from 'joi';
import {Node} from '../Node';
import {Locale} from '../Translations';

export class UserRoles {
	static user = 'user';
	static admin = 'admin';
}

export const UserValidation = {
	username: Joi.string().trim().min(5).max(16).regex(/^[a-z0-9_]*$/).required(),
	mail: Joi.string().email().trim().required(),
	password: Joi.string().min(6).max(32).required(),
	profileText: Joi.string().trim().max(60).allow(null).optional(),
	firstName: Joi.string().trim().min(1).max(24).required(),
	lastName: Joi.string().trim().min(1).max(24).required()
};

export interface User extends Node {
	firstName: string;
	lastName: string;
	username: string;
	profileText: string;
	avatarId: string;
	onBoard: boolean;
	id: string;
	scope: Array<string>;
	location: {
		longitude: number,
		latitude: number,
	};
	languages: Locale[];
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

export interface UserSettings {
	newsletterMails?: boolean;
	notificationMails?: boolean;
	lastNotificationMail?: number;
}

export const UserSettingsValidation = {
	newsletterMails: Joi.boolean().optional(),
	notificationMails: Joi.boolean().optional()
};
