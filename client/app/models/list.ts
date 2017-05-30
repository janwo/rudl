import {Locale} from './locale';
import {Document} from './document';
import {User} from './user';

export interface List extends Document {
	name: string;
	owner: User;
	links: ListLinks;
	icon: string;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		rudel: number;
	};
	translations: Locale.Translations;
}

export interface ListLinks {
	icon: string;
}

export interface ListRecipe {
	translations: Locale.Translations;
	rudel?: string[];
}
