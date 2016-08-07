import {mongoClient} from "../../config/Database";

export const UserProvider = new mongoClient.Schema({
    provider: String,
    userIdentifier: String,
    accessToken: String,
    refreshBefore: Number
});

export const UserSchema = new mongoClient.Schema({
    firstName: String,
    lastName: String,
    username: { type: String, required: true, unique: true },
    mails: [String],
    scope: Array,
    meta: Array,
    location: String,
    auth: {
        password: String,
        providers: [UserProvider]
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export class UserRoles {
    static user = 'user';
    static admin = 'admin';
}

export const User = mongoClient.model<IUser>('User', UserSchema);

export interface IUserProvider {
    provider: string;
    userIdentifier: string;
    accessToken: string;
    refreshBefore: number;
    refreshToken: string;
}

export interface IUser extends mongoClient.Document {
    id?: string | number;
    firstName: string;
    lastName: string;
    username: string;
    mails: [string];
    scope: any;
    location: string;
    meta: any;
    auth: {
        password: string;
        providers: [IUserProvider];
    };
    createdAt: number;
    updatedAt: number;
    comparePassword(password:string, callback: any) : void;
}
