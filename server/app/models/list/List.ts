import {Translations, TranslationsValidation} from '../Translations';
import {Node} from '../Node';

export interface List extends Node {
	translations: Translations;
}

export const ListValidation = {
	translations: TranslationsValidation.required()
};
