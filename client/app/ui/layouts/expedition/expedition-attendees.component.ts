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
import {ScrollService} from '../../../services/scroll.service';
import {Subject} from 'rxjs/Subject';
import {UserService} from '../../../services/user.service';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
    templateUrl: 'expedition-attendees.component.html',
    styleUrls: ['expedition-attendees.component.scss']
})
export class ExpeditionAttendeesComponent implements OnInit, OnDestroy {
	
	expedition: Expedition;
	attendeesSubscription: Subscription;
	attendees: User[] = [];
	overflowButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	invitees: User[] = [];
	searchUser: Subject<string> = new BehaviorSubject(null);
	searchUserSubscription: Subscription;
	
	constructor(
		private userService: UserService,
		private expeditionService: ExpeditionService,
		private route: ActivatedRoute,
		private scrollService: ScrollService
	) {}
	
	ngOnInit(){
		// Define changed params subscription.
		this.attendeesSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
			this.expedition = data.expedition;
			return this.scrollService.hasScrolledToBottom().map(() => this.attendees ? this.attendees.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.expeditionService.attendees(this.expedition.id, offset, 25);
			});
		}).subscribe((attendees: User[]) => {
			if(attendees.length < 25) this.attendeesSubscription.unsubscribe();
			this.attendees = this.attendees ? this.attendees.concat(attendees) : attendees;
		});
		
		// Define invitee subscription.
		this.searchUserSubscription = this.searchUser.asObservable().do(() => {
			this.invitees = [];
		}).filter(query => query && query.length >= 3).do(() => {
			this.invitees = null;
		}).distinctUntilChanged().debounceTime(1000).flatMap(query => {
			return this.userService.like(query, 0, 6);
		}).subscribe(users => {
			this.invitees = users;
		});
	}
	
	ngOnDestroy(): void {
		this.attendeesSubscription.unsubscribe();
	}
}
