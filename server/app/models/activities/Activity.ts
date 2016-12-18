import {Translations} from "../Translations";
import {Document} from "../Document";

export interface Activity extends Document {
	translations: Translations;
}
