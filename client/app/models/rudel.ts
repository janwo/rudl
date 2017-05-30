import {Locale} from './locale';
import {Document} from './document';
import {User} from './user';
import {Location} from './location';

export interface Rudel extends Document {
	name: string;
	owner: User;
	links: RudelLinks;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		lists: number;
		expeditions: number;
	};
	defaultLocation: Location;
	icon: string;
	translations: Locale.Translations;
}

export interface RudelLinks {
	icon: string;
}

export interface RudelRecipe {
	translations: Locale.Translations;
	icon: string,
}
