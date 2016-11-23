export module Locale {
	export type Translations = {[key: string]: string};//TODO Change to language in further ts versions
	
	export type Language = 'de' | 'en' | 'es' | 'fr';
	
	export function getBestTranslation(translations: Translations, languages: Array<Language>): string {
		let bestLanguage = getBestLanguage(translations, languages);
		return bestLanguage ? translations[bestLanguage] : null;
	}
	
	export function getBestLanguage(translations: Translations, languages: Array<Language>): Language {
		let translationLanguages = Object.keys(translations) as Array<Language>;
		for (let i = 0; i < translationLanguages.length; i++) {
			if (languages.indexOf(translationLanguages[i]) >= 0) return languages[i] as Language; //TODO Remove "as Language" in further ts versions
		}
		
		return null;
	}
}
