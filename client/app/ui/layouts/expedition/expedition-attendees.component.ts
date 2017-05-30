import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {User} from '../../../models/user';
import {Expedition, InviteLikeItem} from '../../../models/expedition';
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
	attendees: User[] = [];
	overflowButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	inviteesLike: InviteLikeItem[] = [];
	searchUser: Subject<string> = new BehaviorSubject(null);
	resetAttendees: Subject<any> = new Subject();
	searchUserSubscription: Subscription;
	pendingApprovalRequest = false;
	pendingRejectionRequest = false;
	
	constructor(public parent: ExpeditionComponent,
	            private expeditionService: ExpeditionService,
	            private scrollService: ScrollService,
	            private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`rudl.me - Streifzug "${this.parent.expedition.title}" - Rudler`);
		
		// Define changed params subscription.
		let resetObservable = this.resetAttendees.asObservable().map(() => {
			this.attendees = null;
			return 0;
		});
		let scrollObservable = this.scrollService.hasScrolledToBottom().map(() => this.attendees ? this.attendees.length : 0).distinctUntilChanged();
		this.attendeesSubscription = Observable.merge(resetObservable, scrollObservable).startWith(0).flatMap((offset: number) => {
			return this.expeditionService.attendees(this.parent.expedition.id, offset, 25);
		}).subscribe((attendees: User[]) => {
			this.attendees = this.attendees ? this.attendees.concat(attendees) : attendees;
		});
		
		// Define invitee subscription.
		this.searchUserSubscription = this.searchUser.asObservable().do(() => {
			this.inviteesLike = [];
		}).filter(query => query && query.length >= 3).do(() => {
			this.inviteesLike = null;
		}).distinctUntilChanged().debounceTime(1000).flatMap(query => {
			return this.expeditionService.inviteLike(this.parent.expedition.id, query, 0, 6);
		}).subscribe(inviteesLike => {
			this.inviteesLike = inviteesLike;
		});
	}
	
	approveUser(user: User): void {
		this.pendingApprovalRequest = true;
		this.expeditionService.approve(this.parent.expedition.id, user.username).subscribe((expedition: Expedition) => {
			this.parent.expedition = expedition;
			this.pendingApprovalRequest = false;
			this.resetAttendees.next();
			if (this.inviteesLike) {
				let index = this.inviteesLike.findIndex(val => val.user.id == user.id);
				if (index < 0) return;
				this.inviteesLike.splice(index, 1);
			}
		});
	}
	
	rejectUser(user: User): void {
		console.log('DDDD');
		this.pendingRejectionRequest = true;
		this.expeditionService.reject(this.parent.expedition.id, user.username).subscribe((expedition: Expedition) => {
			this.parent.expedition = expedition;
			this.pendingRejectionRequest = false;
			if (this.attendees) {
				let index = this.attendees.findIndex(val => val.id == user.id);
				if (index < 0) return;
				this.attendees.splice(index, 1);
			}
		});
	}
	
	ngOnDestroy(): void {
		this.attendeesSubscription.unsubscribe();
		this.attendeesSubscription.unsubscribe();
	}
}
