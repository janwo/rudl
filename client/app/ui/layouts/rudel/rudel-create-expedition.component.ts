import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {ExpeditionService} from '../../../services/expedition.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../services/user.service';
import {Location} from '../../../models/location';
import {Locale} from '../../../models/locale';
import * as geolib from 'geolib';
import {ExpeditionRecipe} from '../../../models/expedition';
import {CarouselComponent} from '../../widgets/wrapper/carousel.component';
import {RudelService} from "../../../services/rudel.service";
import {Title} from "@angular/platform-browser";
import {RudelComponent} from "./rudel.component";

@Component({
	templateUrl: 'rudel-create-expedition.component.html',
	styleUrls: ['rudel-create-expedition.component.scss']
})
export class RudelCreateExpeditionComponent implements OnInit {
	
	rudel: Rudel;
    form: FormGroup;
    locations: Location[];
	carouselIndex: number;
	submitPending: boolean;
	@ViewChild(CarouselComponent) carousel: CarouselComponent;
	
	constructor(private router: Router,
	            private route: ActivatedRoute,
				private rudelService: RudelService,
				private userService: UserService,
	            private expeditionService: ExpeditionService,
	            private parent: RudelComponent,
	            private fb: FormBuilder,
				private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`Streifzug erstellen - Rudel "${this.parent.rudel.name}" | rudl.me`);

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
			location: this.fb.group({
				location: [
					null, [
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
			})
		});

		// Load nearby locations.
		this.rudelService.locations(this.rudel.id).subscribe(locations => {
		    this.locations = locations;
			if(!this.form.value.location.location) {
                let center = locations.length > 0 ? geolib.getCenterOfBounds(locations) : this.userService.getAuthenticatedUser().user.location;
			    this.form.get('location').get('location').setValue(center);
            }
		});
	}
	
	setCarouselIndex(index: number): void {
		this.carouselIndex = index;
	}
	
	submit() {
		for (const key in this.form.controls) this.form.controls[key].markAsTouched();
		if (!this.form.valid) {
			// Go to corresponding page.
			Object.keys(this.form.controls).map(key => this.form.controls[key]).every((control: FormGroup, page: number) => {
				Object.keys(control.controls).forEach(controlKey => control.get(controlKey).markAsTouched());
				if (!control.valid) this.carousel.go(page);
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
			this.router.navigate(['/expeditions', expedition.id]);
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value ? value.length : 0} von ${maxChars} Buchstaben verwendet`;
	}
}
