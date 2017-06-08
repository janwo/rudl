import {Component, Input} from '@angular/core';

@Component({
	templateUrl: 'indicator.component.html',
	styleUrls: ['indicator.component.scss'],
	selector: 'indicator'
})
export class IndicatorComponent{
	
	@Input() steps: number;
	@Input() displayAsPercentage: boolean = false;
	@Input() selectedStep: number = 0;
	
}
