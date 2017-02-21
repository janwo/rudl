import {Edge} from "../Edge";

export interface UserJoinsEvent extends Edge {
	approved: boolean;
}
