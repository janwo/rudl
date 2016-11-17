import {Component, Input} from "@angular/core";
import {Router} from "@angular/router";

export interface StatisticItem {
    subject: string;
    value: string;
    link?: any;
}

@Component({
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
    selector: 'statistics'
})
export class StatisticsComponent {
    
    @Input() statistics: Array<StatisticItem>;
    
    constructor(
        private router: Router
    ){}
    
    ngOnInit(){
        this.statistics = this.statistics.map(statistic => {
            statistic.subject = statistic.subject.replace(/\(.*\)/gi, replace => replace.replace(/[()]/gi, ''));
            return statistic;
        });
    }
    
    onClick(item: StatisticItem) {
        if(item.link) this.router.navigateByUrl(item.link);
    }
}
