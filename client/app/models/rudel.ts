import {Locale} from './locale';
import {Document} from './document';
import {UserPreview} from './user';
import {Location} from './location';

export interface RudelPreview extends Document {
	name: string;
	icon: string;
	links: RudelLinks;
	translations: Locale.Translations;
	defaultLocation: Location;
}

export interface Rudel extends RudelPreview {
	owner: UserPreview;
	relations: {
		isLiked: boolean;
		isOwned: boolean;
	};
	statistics: {
		likers: number;
		lists: number;
		expeditions: number;
	};
}

export interface RudelLinks {
	icon: string;
}

export interface RudelRecipe {
	translations: Locale.Translations;
	icon: string,
}
