import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
	name: 'coordinates'
})
export class CoordinatesPipe implements PipeTransform {
	
	transform(location: number[]) {
		return `${Math.round(location[0] * 10000) / 10000}° N ${Math.round(location[1] * 10000) / 10000}° W`;
	}
}
