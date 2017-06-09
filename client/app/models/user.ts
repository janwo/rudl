import {Document} from './document';
import {Locale} from './locale';
import {Location} from './location';

export interface UserPreview extends Document {
	name: string;
	icon: string;
	firstName: string;
	lastName: string;
	username: string;
	hasAvatar: boolean;
	profileText: string;
	links: UserLinks;
	translations: Locale.Translations;
}

export interface User extends UserPreview {
	relations: UserRelations;
	statistics: UserStatistics;
}

export interface AuthenticatedUser extends User {
	location: Location;
	onBoard: boolean;
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
