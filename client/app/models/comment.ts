import {Document} from "./document";
import {User} from "./user";

export interface Comment extends Document {
	text: string;
	owner: User;
	pinned: boolean;
}

export interface CommentRecipe {
	text: string;
	pin: boolean;
}
