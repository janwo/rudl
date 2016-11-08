import {Component, Input} from "@angular/core";

@Component({
    templateUrl: './indicator.component.html',
    styleUrls: ['./indicator.component.scss'],
    selector: 'indicator'
})
export class IndicatorComponent {

    @Input() indicators: Array<string>;
    selectedIndex: number = 0;
    
    constructor() {}

    public onClick(clickedIndex: number) {
        this.selectedIndex = clickedIndex;
    }
}
