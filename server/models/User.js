"use strict";
var _this = this;
// Grab the things we need.
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
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
        bcrypt.genSalt(10, function (err, salt) {
            if (err)
                return next(err);
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err)
                    return next(err);
                user.password = hash;
                next();
            });
        });
    }
    else
        return next();
});
userSchema.method('comparePassword', function (password, cb) {
    bcrypt.compare(password, _this.password, function (err, isMatch) {
        if (err)
            return cb(err);
        cb(null, isMatch);
    });
});
module.exports = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map