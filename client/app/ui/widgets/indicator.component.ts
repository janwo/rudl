import {Component, Input} from "@angular/core";

@Component({
    templateUrl: './indicator.component.html',
    styleUrls: ['./indicator.component.scss'],
    selector: 'indicator'
})
export class IndicatorComponent {

    @Input() indicators: Array<string>;
	@Input() interactive: boolean = true;
    @Input() selectedIndex: number = 0;
    
    constructor() {}

    onClick(clickedIndex: number) {
        if(this.interactive) this.selectedIndex = clickedIndex;
    }
}
