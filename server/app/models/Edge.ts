import {Document} from './Document';

export interface Edge extends Document {
	_from: string;
	_to: string;
}
