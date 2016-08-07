export interface DecodedToken {
    tokenId: string;
    userId: string | number;
}

export interface UserDataCache {
    userId: string | number;
    tokens: Array<TokenData>
}

export interface TokenData {
    tokenId: string;
    expiresAt: number;
    createdAt: number;
    deviceName: string;
}
