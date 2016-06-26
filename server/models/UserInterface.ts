import mongoose = require('mongoose');

interface UserInterface extends mongoose.Document {
    name: string;
    username: string;
    password: string;
    admin: boolean;
    location: String;
    meta: any;
    created_at: Date;
    updated_at: Date;
}

export = UserInterface;
