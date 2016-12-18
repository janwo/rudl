import {Translations} from "../Translations";
import {Document} from "../Document";
import {User} from "../users/User";

export interface List extends Document {
	translations: Translations;
}
