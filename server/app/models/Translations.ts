import * as Joi from 'joi';

export interface Translations {
	[key: string]: string;
}

export const TranslationsKeys: Locale[] = [
	'de', 'en', 'es', 'fr'
];

export type Locale = 'de' | 'en' | 'es' | 'fr';

export const TranslationsValidation = Joi.object().keys({
	de: Joi.string().min(5).max(50).trim(),
	en: Joi.string().min(5).max(50).trim(),
	es: Joi.string().min(5).max(50).trim(),
	fr: Joi.string().min(5).max(50).trim()
}).min(1).optional();
