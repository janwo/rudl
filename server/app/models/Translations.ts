import * as Joi from 'joi';

export interface Translations {
	de?: string;
	en?: string;
	es?: string;
	fr?: string;
	[key: string]: string;
}

export const TranslationsKeys = [
	'de', 'en', 'es', 'fr'
];

export const TranslationsValidation = Joi.object().keys({
	de: Joi.string().min(5).max(50),
	en: Joi.string().min(5).max(50),
	es: Joi.string().min(5).max(50),
	fr: Joi.string().min(5).max(50)
}).min(1).optional();
