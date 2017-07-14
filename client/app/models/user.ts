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
	unreadNotifications: number;
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
	isLikee: boolean;
	isLiker: boolean;
	mutualLikers: number;
	mutualLikees: number;
}

export interface UserStatistics {
	likers: number;
	likees: number;
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
}

export interface UserSettings {
	emailNotifications: boolean;
}

export interface UserSettingsRecipe {
	emailNotifications?: boolean;
}
