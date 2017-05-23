import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {RudelService} from "../../../services/rudel.service";
import {User} from "../../../models/user";
import {Expedition} from '../../../models/expedition';
import {EmptyState} from '../../widgets/state/empty.component';
import {ExpeditionService} from '../../../services/expedition.service';
import {ButtonStyles} from '../../widgets/control/styled-button.component';

@Component({
    templateUrl: 'expedition-attendees.component.html',
    styleUrls: ['expedition-attendees.component.scss']
})
export class ExpeditionAttendeesComponent implements OnInit, OnDestroy {
	
	expedition: Expedition;
	attendeesSubscription: Subscription;
	attendees: User[];
	commentButtonStyle: ButtonStyles = ButtonStyles.filledInverseShadowed;
	
	constructor(
		private expeditionService: ExpeditionService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit(){
		// Define changed params subscription.
		this.attendeesSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
			this.expedition = data.expedition;
			return this.expeditionService.attendees(this.expedition.id);
		}).subscribe((attendees: User[]) => {
			this.attendees = attendees;
		});
	}
	
	ngOnDestroy(): void {
		this.attendeesSubscription.unsubscribe();
	}
	
	submit() {
	
	}
}
