import {Server} from "hapi";
import * as Glob from "glob";
import * as Path from "path";

export class DecoratorsBinder {
	
	public static bind(server: Server): void {
		let decorators: any[] = [];
		Glob.sync(Path.resolve(__dirname, `../decorators/**/*.ts`)).forEach(file => {
			decorators = decorators.concat(require(file).DecoratorsConfig);
		});
		
		decorators.forEach(decorator => {
			server.decorate(decorator.type, decorator.property, decorator.method);
		});
	}
}

export interface DecoratorsConfiguration extends Array<{
	type: string;
	property: string;
	method: Function;
}> {
}
