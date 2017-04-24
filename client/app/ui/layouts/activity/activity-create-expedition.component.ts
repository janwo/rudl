import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ExpeditionService} from "../../../services/expedition.service";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../../services/user.service";
import {Locale} from "../../../models/locale";
import {ExpeditionRecipe} from "../../../models/expedition";
import {CarouselComponent} from "../../widgets/wrapper/carousel.component";

@Component({
    templateUrl: 'activity-create-expedition.component.html',
    styleUrls: ['activity-create-expedition.component.scss']
})
export class ActivityCreateExpeditionComponent implements OnInit {
	
    activity: Activity;
	form: FormGroup;
	submitPending: boolean;
	@ViewChild(CarouselComponent) carousel: CarouselComponent;
	
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private userService: UserService,
		private expeditionService: ExpeditionService,
		private fb: FormBuilder
	) {}
	
	ngOnInit() {
		// Define changed params subscription.
		this.route.parent.data.subscribe((data: { activity: Activity }) => this.activity = data.activity);
		this.form = this.fb.group({
			general: this.fb.group({
				title: [
					Locale.getBestTranslation(this.activity.translations, this.userService.getAuthenticatedUser().user.languages), [
						Validators.required,
						Validators.minLength(3),
						Validators.maxLength(100)
					]
				],
				description: [
					null, [
						Validators.required,
						Validators.minLength(10),
						Validators.maxLength(300)
					]
				],
				needsApproval: [
					false, [
						Validators.required
					]
				]
			}),
			icon: this.fb.group({
				icon: [
					this.activity.icon, [
						Validators.required
					]
				]
			}),
			time: this.fb.group({
				fuzzyTime: [
					false, [
						Validators.required
					]
				],
				date: [
					null, [
						Validators.required
					]
				]
			}),
			location: this.fb.group({
				location: [
					this.activity.defaultLocation, [
						Validators.required
					]
				]
			})
		});
	}
	
	submit() {
		for(const key in this.form.controls) this.form.controls[key].markAsTouched();
		if(!this.form.valid) {
			// Go to corresponding page.
			[
				this.form.controls.general,
				this.form.controls.icon,
				this.form.controls.location,
				this.form.controls.time
			].every((control: FormGroup, page: number) => {
				Object.keys(control.controls).forEach(controlKey => control.get(controlKey).markAsTouched());
				if(!control.valid) this.carousel.go(page);
				return control.valid;
			});
			return;
		}
		
		// Mark as pending.
		this.submitPending = true;
		
		// Create recipe.
		let recipe: ExpeditionRecipe = {
			title: this.form.value.general.title,
			description: this.form.value.general.description,
			needsApproval: this.form.value.general.needsApproval,
			fuzzyTime: this.form.value.time.fuzzyTime,
			activity: this.activity.id,
			date: this.form.value.time.date,
			icon: this.form.value.icon.icon,
			location: this.form.value.location.location
		};
		
		// Fire and remove pending state when done.
		this.expeditionService.create(recipe).subscribe(expedition => {
			this.submitPending = false;
			this.router.navigate(['/expeditions', expedition.id])
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
}
