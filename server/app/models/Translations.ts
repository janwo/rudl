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
	de: Joi.string().min(3),
	en: Joi.string().min(3),
	es: Joi.string().min(3),
	fr: Joi.string().min(3)
}).min(1);
