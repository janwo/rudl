import {Component, Input} from "@angular/core";

@Component({
    template: require('./statistics.component.html'),
    styles: [require('./statistics.component.scss')],
    selector: 'statistics'
})
export class StatisticsComponent {

    @Input() statistics: Array<{
        subject: string;
        value: string;
    }>;
    selectedIndex: number = 0;
    
    constructor() {}

    public onClick(clickedIndex: number) {
        this.selectedIndex = clickedIndex;
    }
}
