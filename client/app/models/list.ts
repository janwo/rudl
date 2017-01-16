import {Locale} from "./locale";
import {Document} from "./document";
import {User} from "./user";

export interface List extends Document {
	name: string;
	owner: User;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		activities: number;
	};
	translations: Locale.Translations;
}
