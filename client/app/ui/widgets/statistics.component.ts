import {Component, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

export interface StatisticItem {
	subject: string;
	value: string;
	link?: string[];
}

@Component({
	templateUrl: 'statistics.component.html',
	styleUrls: ['statistics.component.scss'],
	selector: 'statistics'
})
export class StatisticsComponent {
	
	@Input() statistics: Array<StatisticItem>;
	
	constructor(private router: Router,
	            private route: ActivatedRoute) {}
	
	ngOnInit() {
		this.statistics = this.statistics.map(statistic => {
			statistic.subject = statistic.subject.replace(/\(.*\)/gi, replace => replace.replace(/[()]/gi, ''));
			return statistic;
		});
	}
	
	onClick(item: StatisticItem) {
		if (item.link) this.router.navigate(item.link, {
			relativeTo: this.route
		});
	}
}
