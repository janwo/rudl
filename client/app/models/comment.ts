import {Document} from './document';
import {User} from './user';

export interface Comment extends Document {
	message: string;
	owner: User;
	pinned: boolean;
	relations: {
		isOwned: boolean;
	}
}

export interface CommentRecipe {
	message: string;
	pinned: boolean;
}
