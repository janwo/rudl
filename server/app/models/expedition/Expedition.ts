import {Node} from '../Node';
import * as Joi from 'joi';
import {Config} from '../../../../run/config';
import {User} from '../user/User';
import {Location} from '../Location';

export interface Expedition extends Node {
	title: string;
	description: string;
	needsApproval: boolean;
	date: number;
	fuzzyTime: boolean;
	location: Location;
	icon: string;
}

export const ExpeditionValidation = {
	title: Joi.string().min(5).max(50).trim().required(),
	description: Joi.string().min(5).max(300).trim().required(),
	needsApproval: Joi.boolean().default(false).required(),
	date: Joi.string().isoDate().required(),
	fuzzyTime: Joi.boolean().default(false).required(),
	location: Joi.object().keys({
		longitude: Joi.number().min(-180).max(180).required(),
		latitude: Joi.number().min(-90).max(90).required()
	}),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
