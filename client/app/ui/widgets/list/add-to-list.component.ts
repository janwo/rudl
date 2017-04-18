import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {Activity} from "../../../models/activity";
import {Subscription} from "rxjs";
import {ListService} from "../../../services/list.service";
import {ActivityService} from "../../../services/activity.service";
import {List} from "../../../models/list";
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
	templateUrl: 'add-to-list.component.html',
	styleUrls: ['add-to-list.component.scss'],
	selector: 'add-to-list'
})
export class AddToListComponent implements OnInit, OnDestroy {
	
	@Output() onToggled: EventEmitter<ListItem> = new EventEmitter();
	@Input() activity: Activity;
	form: FormGroup;
	
	listSubscription: Subscription;
	pendingToggleRequest: boolean = false;
	
	constructor(
		private listService: ListService,
	    private activityService: ActivityService,
	    private fb: FormBuilder
	){}
	
	ngOnInit(): void {
		// Create form.
		this.form = this.fb.group({
			lists: this.fb.array([])
		});
		
		// Retrieve lists.
		this.listSubscription = this.listService.by(null, true).combineLatest(this.activityService.lists(this.activity.id, 'owned')).subscribe((combination: [List[], List[]]) => {
			let selectedIds = combination[1].map(list => list.id);
			combination[0].forEach(list => {
				let form = this.fb.group({
					list: list,
					selected: [
						selectedIds.indexOf(list.id) >= 0, [
							Validators.required
						]
					]
				});
				
				(<FormArray> this.form.get('lists')).push(form);
			});
		});
	}
	
	ngOnDestroy(): void {
		this.listSubscription.unsubscribe();
	}
	
	toggleListMembership(expedition: Event, targetList: ListItem): void {
		event.stopPropagation();
		event.preventDefault();
		
		// Block event?
		if(this.pendingToggleRequest) return;
		
		// Set pending state.
		this.pendingToggleRequest = true;
		
		// Delete activity from list, if selected.
		if(targetList.selected) {
			this.listService.deleteActivity(this.activity.id, targetList.list.id).subscribe(() => {
				targetList.selected = false;
				this.onToggled.emit(targetList);
				this.pendingToggleRequest = false;
			});
			return;
		}
		
		// Add activity to list, if unselected.
		this.listService.addActivity(this.activity.id, targetList.list.id).subscribe(() => {
			targetList.selected = true;
			this.onToggled.emit(targetList);
			this.pendingToggleRequest = false;
		});
	}
}

interface ListItem {
	list: List,
	selected: boolean
}
