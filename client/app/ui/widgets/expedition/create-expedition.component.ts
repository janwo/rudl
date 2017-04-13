import {Component, Output, EventEmitter, Input, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../control/styled-button.component";
import Language = Locale.Language;
import Translations = Locale.Translations;
import {Activity} from "../../../models/activity";
import {UserService} from "../../../services/user.service";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {ExpeditionService} from "../../../services/expedition.service";

@Component({
    templateUrl: 'create-expedition.component.html',
    styleUrls: ['create-expedition.component.scss'],
    selector: 'create-expedition'
})
export class CreateExpeditionComponent implements OnInit {
	
	@Input() activity: Activity;
	@Output() onCanceled: EventEmitter<any> = new EventEmitter();
	
	recipe: FormGroup;
    buttonStyleCancel: ButtonStyles = ButtonStyles.outlined;
	submitPending: boolean;
	
    constructor(
	    private router: Router,
        private userService: UserService,
		private expeditionService: ExpeditionService,
	    private fb: FormBuilder
    ) {}
    
	ngOnInit() {
		this.recipe = this.fb.group({
			activity: [ this.activity.id, [
					Validators.required
				]
			],
			title: [
				Locale.getBestTranslation(this.activity.translations, this.userService.getAuthenticatedUser().user.languages), [
					Validators.required,
					Validators.minLength(3),
					Validators.maxLength(100)
				]
			],
			icon: [
				this.activity.icon, [
					Validators.required
				]
			],
			description: [
				null, [
					Validators.required,
					Validators.minLength(10),
					Validators.maxLength(300)
				]
			],
			fuzzyTime: [
				false, [
					Validators.required
				]
			],
			needsApproval: [
				false, [
					Validators.required
				]
			],
			date: [
				null, [
					Validators.required
				]
			],
			location: [
				this.activity.defaultLocation, [
					Validators.required
				]
			]
		});
	}
	
	submit() {
    	for(const key in this.recipe.controls) this.recipe.controls[key].markAsTouched();
		if(!this.recipe.valid) return;
		
		// Mark as pending.
		this.submitPending = true;
		
		// Fire and remove pending state when done.
		this.expeditionService.create(this.recipe.value).subscribe(expedition => {
			this.submitPending = false;
			this.router.navigate(['/expeditions', expedition.id])
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
    
    cancel() {
        this.onCanceled.emit();
    }
    
    assign(assignedObject: any) {
		Object.assign(this.recipe, assignedObject);
    }
}
