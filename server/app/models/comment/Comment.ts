import {Edge} from '../Edge';

export interface Comment extends Edge {
	message: string;
	pinned: boolean;
}
