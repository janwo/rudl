export module Locale {
	export type Translations = { [key: string]: string }; //TODO Change to language in further ts versions
	
	export type Language = 'de' | 'en' | 'es' | 'fr';
	
	export const languages: Language[] = [
		'de',
		'en',
		'es',
		'fr'
	];
	
	export const languageNames = {
		de: 'Deutsch',
		en: 'Englisch',
		es: 'Spanisch',
		fr: 'Französisch'
	};
	
	export function getBestTranslation(translations: Translations, knownLanguages: Array<Language>): string {
		let translationLanguages = Object.keys(translations) as Array<Language>;
		let bestLanguage = getBestLanguage(translationLanguages, knownLanguages);
		return bestLanguage ? translations[bestLanguage] : null;
	}
	
	export function getBestLanguage(languages: Language[], knownLanguages: Array<Language>): Language {
		for (let i = 0; i < knownLanguages.length; i++) if (languages.indexOf(knownLanguages[i]) >= 0) return knownLanguages[i];
		return null;
	}
}
