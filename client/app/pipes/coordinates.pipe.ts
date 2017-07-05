import {Pipe, PipeTransform} from '@angular/core';
import {Location} from "../models/location";

@Pipe({
	name: 'coordinates'
})
export class CoordinatesPipe implements PipeTransform {
	
	transform(location: Location) {
		return `${Math.round(location.latitude * 10000) / 10000}° N ${Math.round(location.longitude * 10000) / 10000}° W`;
	}
}
