import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {Expedition} from "../../../models/expedition";
import {ExpeditionService} from "../../../services/expedition.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'rudel-past-expeditions.component.html',
    styleUrls: ['rudel-past-expeditions.component.scss']
})
export class RudelPastExpeditionsComponent implements OnInit, OnDestroy {
	
    rudel: Rudel;
	expeditionSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Newbie!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions you attended to!'
	};
    
    constructor(
	    private expeditionService: ExpeditionService,
	    private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.expeditionSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
		    this.rudel = data.rudel;
		    return this.expeditionService.by('me', data.rudel.id);
	    }).subscribe((expeditions: Expedition[]) => {
		    this.expeditions = expeditions;
	    });
    }
    
	ngOnDestroy(): void {
    	this.expeditionSubscription.unsubscribe();
	}
}
