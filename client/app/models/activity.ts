import {Locale} from "./locale";
import {Document} from "./document";

export interface Activity extends Document {
	name: string;
	translations: Locale.Translations;
}
