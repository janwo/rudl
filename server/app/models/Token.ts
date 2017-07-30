export interface DecodedToken {
	tokenId: string;
	userId: string;
}

export interface UserDataCache {
	userId: string;
	tokens: Array<TokenData>;
	singleTokens: {
		resetPassword: string,
		verifyMail: string
	};
}

export interface TokenData {
	tokenId: string;
	expiresAt: number;
	createdAt: number;
	deviceName: string;
}
