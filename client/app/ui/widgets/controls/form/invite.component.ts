import {Component, EventEmitter, Output, HostBinding, OnInit, OnDestroy, ViewChild, ElementRef} from "@angular/core";
import {trigger, transition, style, animate, state} from "@angular/animations";
import {User} from "../../../../models/user";
import {UserService} from "../../../../services/user.service";
import {ReplaySubject, Subject, Subscription} from "rxjs";

@Component({
	templateUrl: 'invite.component.html',
	styleUrls: ['invite.component.scss'],
	selector: 'invite',
	animations: [
		trigger('expandVertically', [
			state('*', style({
				height: '*',
				opacity: 1
			})),
			state('void', style({
				height: 0,
				opacity: 0
			})),
			transition(':leave', animate('0.3s')),
			transition(':enter', animate('0.3s'))
		]),
	]
})
export class InviteComponent implements OnInit, OnDestroy {

	@Output() change: EventEmitter<string> = new EventEmitter();
	
	invitedUsers: User[] = [];
	searchedUsers: User[] = null;
	searchUser: Subject<string> = new ReplaySubject(1);
	searchUserSubscription: Subscription;
	@HostBinding('class.focused') expanded: boolean;
	@ViewChild('inputElement') inputElement: ElementRef;
	
	constructor(
		private userService: UserService
	) {}
	
	ngOnInit(): void {
		this.searchUserSubscription = this.searchUser.asObservable().filter(query => query.length >= 3).distinctUntilChanged().debounceTime(1000).flatMap(query => {
			return this.userService.like(query);
		}).subscribe(users => {
			this.searchedUsers = users.filter(user => !this.invitedUsers.find(invitedUser => invitedUser.username == user.username));
		});
	}
	
	ngOnDestroy(): void {
		this.searchUserSubscription.unsubscribe();
	}
	
	add(user: User): void {
		this.invitedUsers.push(user);
		this.searchedUsers = null;
		this.inputElement.nativeElement.value = '';
		this.inputElement.nativeElement.focus();
	}
	
	remove(user: User): void {
		this.invitedUsers.splice(this.invitedUsers.indexOf(user), 1);
	}
}
