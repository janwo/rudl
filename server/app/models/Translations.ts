import Joi = require('joi')

export interface Translations {
	de?: string;
	en?: string;
	es?: string;
	fr?: string;
}

export const TranslationsKeys = [
	'de', 'en', 'es', 'fr'
];

export const TranslationsValidation = Joi.object().keys({
	de: Joi.string().min(5).max(32),
	en: Joi.string().min(5).max(32),
	es: Joi.string().min(5).max(32),
	fr: Joi.string().min(5).max(32)
}).min(1).optional();
