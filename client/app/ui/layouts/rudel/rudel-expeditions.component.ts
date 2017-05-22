import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {Expedition} from "../../../models/expedition";
import {ExpeditionService} from "../../../services/expedition.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'rudel-expeditions.component.html',
    styleUrls: ['rudel-expeditions.component.scss']
})
export class RudelExpeditionsComponent implements OnInit, OnDestroy {
	
    rudel: Rudel;
	expeditionSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'That\'s sad',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions around here. Create one and make your locals happy!'
	};
    
    constructor(
	    private expeditionService: ExpeditionService,
	    private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.expeditionSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
		    this.rudel = data.rudel;
		    return this.expeditionService.nearby(data.rudel.id);
	    }).subscribe((expeditions: Expedition[]) => {
		    this.expeditions = expeditions;
	    });
    }
    
	ngOnDestroy(): void {
    	this.expeditionSubscription.unsubscribe();
	}
}
