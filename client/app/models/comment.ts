import {Document} from "./document";
import {User} from "./user";

export interface Comment extends Document {
	message: string;
	owner: User;
	pinned: boolean;
}

export interface CommentRecipe {
	message: string;
	pin: boolean;
}
