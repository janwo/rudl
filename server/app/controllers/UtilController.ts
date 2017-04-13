import Nodemailer = require("nodemailer");
import Boom = require("boom");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {Cursor} from "arangojs";
import jwt = require("jsonwebtoken");
import _ = require("lodash");
import {Config} from "../../../run/config";

export module UtilController {
	const iconDictionary = _.mapValues(Config.backend.icons, val => {
		val.image = `${Config.backend.domain}/static/icons/${val.image}`;
		return val;
	});
	
	export function getIconUrl(name: string): string {
		let icon = iconDictionary[name];
		return icon ? icon.image : null;
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/utils/icons
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function getIcons(request: any, reply: any): void {
			let promise: Promise<any> = Promise.resolve(iconDictionary);
			reply.api(promise);
		}
		
	}
}
