import {Document} from './document';
import {Locale} from './locale';
import {Location} from './location';

export interface User extends Document {
	firstName: string;
	lastName: string;
	username: string;
	location: Location;
	profileText: string;
	hasAvatar: boolean;
	onBoard: boolean;
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
	rudel: number;
}

export interface UserRecipe {
	username?: string;
	mail?: string;
	password?: string;
	profileText?: string;
	firstName?: string;
	lastName?: string;
};
