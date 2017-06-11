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
		isLiked: boolean;
		isOwned: boolean;
	};
	statistics: {
		likers: number;
		rudel: number;
	};
}

export interface ListLinks {
}

export interface ListRecipe {
	translations: Locale.Translations;
	rudel?: string[];
}
