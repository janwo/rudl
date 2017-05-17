import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {RudelService} from "../../../services/rudel.service";
import {Rudel} from "../../../models/rudel";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'user-rudel.component.html',
    styleUrls: ['user-rudel.component.scss']
})
export class UserRudelComponent implements OnInit, OnDestroy {
	
	rudelSubscription: Subscription;
	rudel: Rudel[] = null;
	emptyState: EmptyState = {
		title: 'There are no Rudels',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Why not search for new Rudels that you like?'
	};
	
	constructor(
		private rudelService: RudelService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.rudelSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.rudel = null;
		}).flatMap(rudel => {
			return this.rudelService.by(rudel);
		}).subscribe((rudel: Rudel[]) => {
			this.rudel = rudel;
		});
	}
	
	ngOnDestroy() {
		this.rudelSubscription.unsubscribe();
	}
}
