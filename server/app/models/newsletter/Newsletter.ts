import {Translations} from '../Translations';

export interface Newsletter {
	ready: boolean;
	sent: boolean;
	answerable: boolean;
	mail: Translations<{
	    subject: string,
	    text: string
	}>
}