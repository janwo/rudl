import {LatLngLiteral} from 'leaflet';

export interface Location {
	latitude: number;
	longitude: number;
}

export interface VagueLocation extends Location {
	accuracy: number;
}
