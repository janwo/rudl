import {Node} from '../Node';
import * as Joi from 'joi';
import {Config} from '../../../../run/config';
import {User} from '../user/User';

export interface Expedition extends Node {
	title: string;
	description: string;
	needsApproval: boolean;
	date: number;
	fuzzyTime: boolean;
	location: {
		lat: number,
		lng: number
	};
	icon: string;
}

export const ExpeditionValidation = {
	title: Joi.string().min(5).max(50).trim().required(),
	description: Joi.string().min(5).max(300).trim().required(),
	needsApproval: Joi.boolean().default(false).required(),
	date: Joi.string().isoDate().required(),
	fuzzyTime: Joi.boolean().default(false).required(),
	location: Joi.object().keys({
		lng: Joi.number().min(-180).max(180).required(),
		lat: Joi.number().min(-90).max(90).required()
	}),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
