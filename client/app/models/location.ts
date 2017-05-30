import {LatLngLiteral} from 'leaflet';

export interface Location extends LatLngLiteral {
}

export interface VagueLocation extends Location {
	accuracy: number;
}
