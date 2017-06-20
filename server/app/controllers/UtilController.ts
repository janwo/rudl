import * as _ from 'lodash';
import {Config} from '../../../run/config';

export module UtilController {
	const iconDictionary = _.mapValues(Config.backend.icons, val => {
		val.image = `${Config.backend.domain}/static/icons/${val.image}`;
		return val;
	});
	
	export function getIconUrl(name: string): string {
		let icon = iconDictionary[name];
		return icon ? icon.image : null;
	}
	
	export function isoDate(seconds: number): string {
		return new Date(seconds * 1000).toISOString();
	}
	
	export function timestamp(iso: string): number {
		return new Date(iso).getTime() / 1000;
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
