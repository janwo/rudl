import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ExpeditionService} from "../../../services/expedition.service";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../../services/user.service";
import {Locale} from "../../../models/locale";
import {ExpeditionRecipe} from "../../../models/expedition";
import {CarouselComponent} from "../../widgets/wrapper/carousel.component";

@Component({
    templateUrl: 'rudel-create-expedition.component.html',
    styleUrls: ['rudel-create-expedition.component.scss']
})
export class RudelCreateExpeditionComponent implements OnInit {
	
    rudel: Rudel;
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
		this.route.parent.data.subscribe((data: { rudel: Rudel }) => this.rudel = data.rudel);
		this.form = this.fb.group({
			general: this.fb.group({
				title: [
					Locale.getBestTranslation(this.rudel.translations, this.userService.getAuthenticatedUser().user.languages), [
						Validators.required,
						Validators.minLength(5),
						Validators.maxLength(100)
					]
				],
				description: [
					null, [
						Validators.required,
						Validators.minLength(5),
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
					this.rudel.icon, [
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
					this.rudel.defaultLocation, [
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
			date: this.form.value.time.date,
			icon: this.form.value.icon.icon,
			location: this.form.value.location.location
		};
		
		// Fire and remove pending state when done.
		this.expeditionService.create(recipe, this.rudel).subscribe(expedition => {
			this.submitPending = false;
			this.router.navigate(['/expeditions', expedition.id])
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value.length} of ${maxChars} characters used`;
	}
}