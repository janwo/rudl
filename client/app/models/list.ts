import {Locale} from "./locale";
import {Document} from "./document";

export interface List extends Document {
	name: string;
	translations: Locale.Translations;
}
