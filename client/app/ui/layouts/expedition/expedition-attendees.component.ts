import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {User} from '../../../models/user';
import {Expedition, ExpeditionAttendeeStatus, ExpeditionRequestResponse} from '../../../models/expedition';
import {ExpeditionService} from '../../../services/expedition.service';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {ScrollService} from '../../../services/scroll.service';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ExpeditionComponent} from './expedition.component';
import {Title} from '@angular/platform-browser';

@Component({
	templateUrl: 'expedition-attendees.component.html',
	styleUrls: ['expedition-attendees.component.scss']
})
export class ExpeditionAttendeesComponent implements OnInit, OnDestroy {
	
	attendeesSubscription: Subscription;
    inviteLikeSubscription: Subscription;
    recommendeeSubscription: Subscription;
	pendingRequestsSubscription: Subscription;
	attendees: {
		user: User,
		status: ExpeditionAttendeeStatus
	}[] = [];
	inviteesLike: {
		user: User,
		status: ExpeditionAttendeeStatus
	}[] = [];
	searchUser: Subject<string> = new BehaviorSubject(null);
    approveUser: Subject<User> = new Subject();
    recommendUser: Subject<User> = new Subject();
	rejectUser: Subject<User> = new Subject();
	pendingRequest = false;
	overflowButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	
	constructor(public parent: ExpeditionComponent,
	            private expeditionService: ExpeditionService,
	            private scrollService: ScrollService,
	            private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`Teilnehmer - Streifzug "${this.parent.expedition.getValue().title}" | rudl.me`);

        // Define observables for changed user statuses.
        let approveObservable = this.approveUser.asObservable().flatMap(user => {
            this.pendingRequest = true;
            return this.expeditionService.approve(this.parent.expedition.getValue().id, user.username);
        });
		
		let rejectObservable = this.rejectUser.asObservable().flatMap(user => {
			this.pendingRequest = true;
			return this.expeditionService.reject(this.parent.expedition.getValue().id, user.username);
		});

        let recommendeeObservable = this.recommendUser.asObservable().flatMap(user => {
            this.pendingRequest = true;
            return this.expeditionService.approve(this.parent.expedition.getValue().id, user.username);
        });

        let finishRequest = (expeditionRequestResponse: ExpeditionRequestResponse, updateInviteesOnly: boolean = false) => {
            this.pendingRequest = false;
            this.parent.expedition.next(expeditionRequestResponse.expedition);
            let item = {
                user: expeditionRequestResponse.user,
                status: expeditionRequestResponse.status
            };

            if (!updateInviteesOnly && this.attendees) {
                let index = this.attendees.findIndex(val => val.user.id == expeditionRequestResponse.user.id);

                // Exchange item.
                if (index < 0)
                    this.attendees = [item].concat(this.attendees);
                else
                    this.attendees.splice(index, 1, item);
            }

            if (this.inviteesLike) {
                let index = this.inviteesLike.findIndex(val => val.user.id == expeditionRequestResponse.user.id);
                if (index >= 0) this.inviteesLike.splice(index, 1, item);
            }
        };

        // Define subscriptions for recommendations.
		this.pendingRequestsSubscription = Observable.merge(approveObservable, rejectObservable).subscribe((expeditionRequestResponse: ExpeditionRequestResponse) => finishRequest(expeditionRequestResponse));
        this.recommendeeSubscription = recommendeeObservable.subscribe((expeditionRequestResponse: ExpeditionRequestResponse) => finishRequest(expeditionRequestResponse, true));

		// Define scroll subscription.
		this.attendeesSubscription = this.scrollService.hasScrolledToBottom().map(() => this.attendees ? this.attendees.filter(attendee => attendee.status.isAttendee || attendee.status.isApplicant || attendee.status.isInvitee).length : 0).startWith(0).distinctUntilChanged().flatMap((offset: number) => {
			return this.expeditionService.attendees(this.parent.expedition.getValue().id, offset, 25);
		}).subscribe(attendees => {
			this.attendees = this.attendees ? this.attendees.concat(attendees) : attendees;
		});
		
		// Define invitee subscription.
		this.inviteLikeSubscription = this.searchUser.asObservable().do(() => {
			this.inviteesLike = [];
		}).distinctUntilChanged().filter(query => query && query.length >= 3).do(() => {
			this.inviteesLike = null;
		}).debounceTime(1000).flatMap(query => {
			return this.expeditionService.inviteLike(this.parent.expedition.getValue().id, query, 0, 6);
		}).subscribe(inviteesLike => {
			this.inviteesLike = inviteesLike;
		});
	}
	
	getUserInfo(status: ExpeditionAttendeeStatus): string {
		if(status.isAttendee) return 'Nimmt teil';
		if(status.isInvitee) return 'Ist eingeladen';
        if(status.isApplicant) return 'Wartet auf Annahme';
        if(status.isRecommendee) return 'Hinweis erhalten';
		return null;
	}
	
	ngOnDestroy(): void {
		this.inviteLikeSubscription.unsubscribe();
        this.recommendeeSubscription.unsubscribe();
        this.attendeesSubscription.unsubscribe();
	}
}
