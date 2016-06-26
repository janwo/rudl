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
    };
    ServerApp.prototype.setPort = function (port) {
        this.port = port;
    };
    ServerApp.prototype.setPublicDir = function (dir) {
        this.publicDir = dir;
    };
    ServerApp.prototype.setRoutes = function () {
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(express.static(this.publicDir));
        this.app.get("/api/users/:username", function (req, res) {
            User.findOne({ username: req.params.username }, function (err, user) {
                // User not found.
                if (err) {
                    ServerApp.handleError(res, 'Invalid user', err.message);
                    return;
                }
                // Return user.
                console.log('Found user:', user.username);
                res.status(200).json(user.username);
            });
        });
        this.app.post("/api/users/:username", function (req, res) {
            var user = new User({
                username: req.params.username,
                password: 123
            });
            // Save the user.
            user.save(function (err) {
                if (err) {
                    ServerApp.handleError(res, 'Could not create user.', err.message);
                    return;
                }
                console.log('Created user', user.username);
            });
        });
    };
    ServerApp.prototype.startServer = function () {
        // Output settings.
        console.log('mongo url:', this.mongoUrl);
        console.log('port:', this.port);
        console.log('public dir:', this.publicDir);
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
//# sourceMappingURL=server.js.map