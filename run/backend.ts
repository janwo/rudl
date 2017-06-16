// Run backend server.
import {hapiServer} from '../server/app/Hapi';
hapiServer().catch((err: any) => console.error(err));
