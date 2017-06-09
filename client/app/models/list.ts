import {Locale} from './locale';
import {Document} from './document';
import {User, UserPreview} from './user';

export interface ListPreview extends Document {
	name: string;
	links: ListLinks;
	translations: Locale.Translations;
}

export interface List extends ListPreview {
	owner: UserPreview;
	relations: {
		isFollowed: boolean;
		isOwned: boolean;
	};
	statistics: {
		followers: number;
		rudel: number;
	};
}

export interface ListLinks {
}

export interface ListRecipe {
	translations: Locale.Translations;
	rudel?: string[];
}
