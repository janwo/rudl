import bodyParser = require("body-parser");
import morgan = require("morgan");
import passport = require("passport");
import mongoose = require("mongoose");
import express = require('express');
import User = require('./models/User');
import {Response} from "express-serve-static-core";
import {Mongoose} from "~mongoose/index";
import UserInterface = require("./models/UserInterface");

export class ServerApp {

    private app: express.Express;
    private mongoUrl: string;
    private port: number = process.env.PORT || 8080;
    private db: Mongoose;
    private publicDir: string;

    constructor() {
        this.app = express();
    }

    public setMongoUrl(url: string) {
        this.mongoUrl = url;
    }

    public setPort(port: number) {
        this.port = port;
    }

    public setPublicDir(dir: string) {
        this.publicDir = dir;
    }

    private setRoutes(){
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(express.static(this.publicDir));

        this.app.get("/api/users/:username", (req, res) => {
            User.findOne({username: req.params.username}, (err: any, user: UserInterface) => {
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

        this.app.post("/api/users/:username", (req, res) => {
            var user = new User({
                username: req.params.username,
                password: 123
            });

            // Save the user.
            user.save((err) => {
                if (err) {
                    ServerApp.handleError(res, 'Could not create user.', err.message);
                    return;
                }

                console.log('Created user', user.username);
            });
        })
    }

    public startServer() {
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
        var server = this.app.listen(this.port, () => {
            var port = server.address().port;
            console.log('This express app is listening on port', port);
        });
    }

    public stopServer(){
        // Disconnect from database connection.
        if(this.db) this.db.disconnect();
    }

    private static handleError(res: Response, reason: string, message: string, code?: number) {
        console.error("ERROR (" + reason + "): " + message);
        res.status(code || 500).json({"error": reason});
    }
}
