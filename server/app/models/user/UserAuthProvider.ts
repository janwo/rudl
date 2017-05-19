export interface UserAuthProvider {
	provider: string;
	identifier: string;
	accessToken: string;
	refreshBefore: number;
	refreshToken: string;
}
