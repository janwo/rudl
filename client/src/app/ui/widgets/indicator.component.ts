import {Component, Input} from "@angular/core";

@Component({
    template: require('./indicator.component.html'),
    styles: [require('./indicator.component.scss')],
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
