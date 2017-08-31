import * as Joi from 'joi';

export interface Translations<T = string> {
	[key: string]: T;
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

export function getBestTranslation<T = string>(translations: Translations<T>, knownLanguages: Array<Locale>): T {
    let translationLanguages = Object.keys(translations) as Array<Locale>;
    let bestLanguage = getBestLanguage(translationLanguages, knownLanguages);
    return bestLanguage ? translations[bestLanguage] : null;
}

export function getBestLanguage(languages: Locale[], knownLanguages: Array<Locale>): Locale {
    for (let i = 0; i < knownLanguages.length; i++) if (languages.indexOf(knownLanguages[i]) >= 0) return knownLanguages[i];
    return null;
}