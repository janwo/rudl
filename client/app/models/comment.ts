import {Document} from './document';
import {User, UserPreview} from './user';

export interface Comment extends Document {
	message: string;
	owner: UserPreview;
	pinned: boolean;
	relations: {
		isOwned: boolean;
	}
}

export interface CommentRecipe {
	message: string;
	pinned: boolean;
}
