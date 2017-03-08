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
	onBoard: boolean;
}

export interface UserRelations {
	isFollowee: boolean;
	isFollower: boolean;
	mutualFollowers: number;
	mutualFollowees: number;
}

export interface UserStatistics {
	followers: number;
	followees: number;
	lists: number;
	activities: number;
}
