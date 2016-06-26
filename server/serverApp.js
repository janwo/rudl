"use strict";
var bodyParser = require("body-parser");
var morgan = require("morgan");
var passport = require("passport");
var mongoose = require("mongoose");
var express = require('express');
var User = require('./models/User');
var ServerApp = (function () {
    function ServerApp() {
        this.port = process.env.PORT || 8080;
        this.app = express();
    }
    ServerApp.prototype.setMongoUrl = function (url) {
        this.mongoUrl = url;
        console.log('Set mongo url to', url);
    };
    ServerApp.prototype.setPort = function (port) {
        this.port = port;
        console.log('Set port to', port);
    };
    ServerApp.prototype.setPublicDir = function (dir) {
        this.publicDir = dir;
        console.log('Set public dir to', dir);
    };
    ServerApp.prototype.setRoutes = function () {
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(express.static(this.publicDir));
        this.app.get("/users/:username", function (req, res) {
            User.findOne({ username: req.params.username }, function (err, user) {
                // User not found.
                if (err) {
                    ServerApp.handleError(res, 'Invalid user', err.message);
                    return;
                }
                // Return user.
                console.log('Found user:', user);
                res.status(200).json(user);
            });
        });
        this.app.post("/users/:username", function (req, res) {
            var newUser = new User({
                username: req.params.username,
                password: 123
            });
            // Save the user.
            newUser.save(function (err) {
                if (err) {
                    ServerApp.handleError(res, 'Could not create user.', err.message);
                    return;
                }
                console.log('Created user', newUser);
            });
        });
    };
    ServerApp.prototype.startServer = function () {
        // Set routes.
        this.setRoutes();
        // Setup database.
        this.db = mongoose.connect(this.mongoUrl);
        // Setup logging.
        this.app.use(morgan('dev'));
        // Use the passport package in our application
        this.app.use(passport.initialize());
        // Initialize the app.
        var server = this.app.listen(this.port, function () {
            var port = server.address().port;
            console.log('This express app is listening on port', port);
        });
    };
    ServerApp.prototype.stopServer = function () {
        // Disconnect from database connection.
        if (this.db)
            this.db.disconnect();
    };
    ServerApp.handleError = function (res, reason, message, code) {
        console.error("ERROR (" + reason + "): " + message);
        res.status(code || 500).json({ "error": reason });
    };
    return ServerApp;
}());
exports.ServerApp = ServerApp;
//# sourceMappingURL=serverApp.js.map