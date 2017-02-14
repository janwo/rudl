import {
	Component, Input, trigger, state, style, transition, animate, OnInit, OnDestroy, Output,
	EventEmitter, OnChanges, SimpleChanges
} from "@angular/core";
import {Activity} from "../../models/activity";
import {Subscription} from "rxjs";
import {ListService} from "../../services/list.service";
import {ActivityService} from "../../services/activity.service";
import {List} from "../../models/list";

@Component({
	templateUrl: './add-to-list.component.html',
	styleUrls: ['./add-to-list.component.scss'],
	selector: 'add-to-list',
	animations: [
		trigger('container', [
			state('true', style({
				height: '*',
				opacity: 1
			})),
			state('false', style({
				height: 0,
				opacity: 0
			})),
			transition('1 => 0', animate('300ms')),
			transition('0 => 1', animate('300ms'))
		])
	]
})
export class AddToListComponent implements OnInit, OnDestroy {
	
	@Output() onToggled: EventEmitter<[List, boolean]> = new EventEmitter();
	@Input() activity: Activity;
	ownedLists: List[];
	selectedListKeysOfActivity: string[];
	
	listSubscription: Subscription;
	pendingToggleRequest: boolean = false;
	
	constructor(
		private listService: ListService,
	    private activityService: ActivityService
	){}
	
	ngOnInit(): void {
		// Retrieve lists.
		this.listSubscription = this.listService.by(null, true).combineLatest(this.activityService.lists(this.activity.id, 'owned')).subscribe((combination: [List[], List[]]) => {
			this.ownedLists = combination[0];
			this.selectedListKeysOfActivity = combination[1].map(list => list.id);
		});
	}
	
	ngOnDestroy(): void {
		this.listSubscription.unsubscribe();
	}
	
	toggleListMembership(event: Event, list: List): void {
		event.stopPropagation();
		event.preventDefault();
		
		// Block event?
		if(this.pendingToggleRequest) return;
		
		// Set pending state.
		this.pendingToggleRequest = true;
		
		// Delete activity from list, if selected.
		let index = this.selectedListKeysOfActivity.indexOf(list.id);
		if(index >= 0) {
			this.listService.deleteActivity(this.activity.id, list.id).subscribe(() => {
				this.selectedListKeysOfActivity.splice(index, 1);
				this.pendingToggleRequest = false;
				this.onToggled.emit([list, false]);
			});
			return;
		}
		
		// Add activity to list, if unselected.
		this.listService.addActivity(this.activity.id, list.id).subscribe(() => {
			this.selectedListKeysOfActivity.push(list.id);
			this.pendingToggleRequest = false;
			this.onToggled.emit([list, true]);
		});
	}
}
