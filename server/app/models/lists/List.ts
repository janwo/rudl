import {Translations} from "../Translations";
import {Document} from "../Document";

export interface List extends Document {
	translations: Translations;
}
