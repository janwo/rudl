import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {List} from "../../../models/list";
import {ListService} from "../../../services/list.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'list-rudel.component.html',
    styleUrls: ['list-rudel.component.scss']
})
export class ListRudelComponent implements OnInit, OnDestroy {
	
	rudelSubscription: Subscription;
    list: List;
    rudel: Rudel[] = null;
	emptyState: EmptyState = {
		title: 'List is empty',
		image: require('..//../../../assets/boarding/radar.png'),
		description: 'There are no rudels in the list yet.'
	};
    
    constructor(
	    private listService: ListService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.rudelSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
		    this.list = data.list;
		    return this.listService.rudel(data.list.id);
	    }).subscribe((rudel: Rudel[]) => this.rudel = rudel);
    }
    
	ngOnDestroy(): void {
    	this.rudelSubscription.unsubscribe();
	}
}
