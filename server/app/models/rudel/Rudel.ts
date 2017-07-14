import {Translations, TranslationsValidation} from '../Translations';
import {Node} from '../Node';
import * as Joi from 'joi';
import {Config} from '../../../../run/config';

export interface Rudel extends Node {
	translations: Translations;
	icon: string;
}

export const RudelValidation = {
	translations: TranslationsValidation.required(),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
