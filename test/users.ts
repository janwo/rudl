import {Server} from 'hapi';
import "mocha";
import * as chai from "chai";
import {handleJsonResponse, Test} from './utils';
import {AccountController} from '../server/app/controllers/AccountController';
import {User} from '../server/app/models/user/User';

export class UserTests extends Test {
	run(server: Server): void {
		describe('User Management', function () {
			let users: User[] = null;
			
			before(function() {
				return server.inject({
					url: '/api/test/create-users/2',
					method: 'POST'
				}).then((response: any) => {
					users = handleJsonResponse(response).data;
				});
			});
			
			it('created test users properly', function() {
				chai.assert.isArray(users);
			});
		});
	}
}
