import {Server} from 'hapi';

export abstract class Test {
	abstract run(server: Server): Promise<void> | void;
}

export function handleJsonResponse(response: any): any {
	return JSON.parse(response.payload);
}
