// Run backend server.
import {server} from '../server/app/Server';
server().catch((err: any) => console.error(err));
