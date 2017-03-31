import {Locale} from "./locale";
import {Document} from "./document";
import {User} from "./user";

export interface Activity extends Document {
	name: string;
	owner: User;
	links: ActivityLinks;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		lists: number;
		events: number;
	};
	defaultLocation: number[];
	translations: Locale.Translations;
}

export interface ActivityLinks {
}

export interface ActivityRecipe {
	translations: Locale.Translations;
}
