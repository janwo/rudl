import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {RudelService} from '../../../services/rudel.service';
import {Rudel} from '../../../models/rudel';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {RudelItemStyles} from '../../widgets/rudel/rudel-item.component';

@Component({
	templateUrl: 'user-rudel.component.html',
	styleUrls: ['user-rudel.component.scss']
})
export class UserRudelComponent implements OnInit, OnDestroy {
	
	rudelSubscription: Subscription;
	rudel: Rudel[] = null;
	rudelItemStyle: RudelItemStyles = RudelItemStyles.list;
	emptyState: EmptyState = {
		title: 'There are no Rudels',
		image: require('../../../../assets/illustrations/no-rudel.png'),
		description: 'Why not search for new Rudels that you like?'
	};
	
	constructor(private rudelService: RudelService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.rudelSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.rudel = null;
		}).flatMap(username => {
			return this.scrollService.hasScrolledToBottom().map(() => this.rudel ? this.rudel.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.rudelService.by(username, offset, 25);
			});
		}).subscribe((rudel: Rudel[]) => {
			if (rudel.length < 25) this.rudelSubscription.unsubscribe();
			this.rudel = this.rudel ? this.rudel.concat(rudel) : rudel;
		});
	}
	
	ngOnDestroy() {
		this.rudelSubscription.unsubscribe();
	}
}
