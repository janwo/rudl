import {Edge} from "../Edge";

export interface UserJoinsExpedition extends Edge {
	invitation: boolean;
	awaiting: boolean;
	approved: boolean;
}
