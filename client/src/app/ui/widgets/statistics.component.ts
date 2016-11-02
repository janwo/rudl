import {Component, Input} from "@angular/core";
import {Router} from "@angular/router";

interface StatisticItem {
    subject: string;
    value: string;
    link?: any;
}

@Component({
    template: require('./statistics.component.html'),
    styles: [require('./statistics.component.scss')],
    selector: 'statistics'
})
export class StatisticsComponent {
    
    @Input() statistics: Array<StatisticItem>;
    
    constructor(
        private router: Router
    ){}
    
    onClick(item: StatisticItem) {
        if(item.link) this.router.navigateByUrl(item.link);
    }
}
