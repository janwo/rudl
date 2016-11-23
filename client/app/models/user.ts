import {Document} from "./document";
import {Locale} from "./locale";

export interface User extends Document {
	firstName: string;
	lastName: string;
	username: string;
	location: string;
	meta: UserMeta;
	relations: UserRelations;
	statistics: UserStatistics;
	links: UserLinks;
	languages: Array<Locale.Language>;
}

export interface UserLinks {
	avatars?: {
		small: string;
		medium: string;
		large: string;
	};
}

export interface UserMeta {
	hasAvatar: boolean;
	profileText: string;
}

export interface UserRelations {
	followee: boolean;
	follower: boolean;
	mutual_followers: number;
	mutual_followees: number;
}

export interface UserStatistics {
	followers: number;
	followees: number;
	lists: number;
	activities: number;
}
