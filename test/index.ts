import {Config} from '../run/config';
import {Server} from 'hapi';
import "mocha";
import {hapiServer} from '../server/app/Hapi';
import {UserTests} from './users';

describe(`Testing ${Config.name}`, function() {
	let server: Server = null;
	before(function(){
		this.timeout(0);
		return hapiServer().then((s: Server) => server = s);
	});
	
	after(function(){
		this.timeout(0);
		return server.stop();
	});
	
	this.timeout(1000 * 60);
	it('Testing backend', function(){
		return Promise.all([
			new UserTests().run(server)
		]);
	});
});
