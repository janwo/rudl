import {Locale} from "./locale";
import {Document} from "./document";
import {User} from "./user";

export interface Activity extends Document {
	name: string;
	owner: User;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		lists: number;
	};
	translations: Locale.Translations;
}
