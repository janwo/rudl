import {Locale} from "./locale";
import {Document} from "./document";
import {User} from "./user";

export interface List extends Document {
	name: string;
	owner: User;
	relations: {
		following: boolean;
		owning: boolean;
	};
	followers: number;
	translations: Locale.Translations;
}
