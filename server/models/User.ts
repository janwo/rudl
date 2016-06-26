// Grab the things we need.
import mongoose = require('mongoose');
import bcrypt = require('bcrypt');
import UserInterface = require("./UserInterface");

var userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: Boolean,
    location: String,
    meta: {
        age: Number,
        website: String
    },
    created_at: Date,
    updated_at: Date
});

userSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        });
    } else return next();
});

userSchema.method('comparePassword', (password, cb) => {
    bcrypt.compare(password, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
});

// Make it available in our node application.
export = mongoose.model<UserInterface>('User', userSchema);
