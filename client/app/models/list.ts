import {Locale} from "./locale";
import {Document} from "./document";
import {User} from "./user";

export interface List extends Document {
	name: string;
	owner: User;
	links: ListLinks;
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

export interface ListLinks {
}

export interface ListRecipe {
	translations: Locale.Translations;
	activities: string[];
}
