import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService, UserStatus} from '../../../services/user.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {User, UserSettings} from "../../../models/user";
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {Subscription} from 'rxjs/Subscription';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'settings-notifications.component.html',
	styleUrls: ['settings-notifications.component.scss']
})
export class SettingsNotificationsComponent implements OnInit, OnDestroy {
	
	form: FormGroup;
	settings: UserSettings;
	pendingSettingsUpdate = false;
	settingsSubmitButtonStyle = ButtonStyles.outlined;
	settingsSubscription: Subscription;
	
	constructor(public userService: UserService,
	            private fb: FormBuilder,
				private title: Title ) {}
	
	ngOnInit() {
		this.title.setTitle(`Mail - Einstellungen | rudl.me`);

		this.form = this.fb.group({
			notificationMails: [
				true, [
				]
			],
			newsletterMails: [
				true, [
				]
			]
		});
		
		this.settingsSubscription = this.userService.settings().subscribe((settings: UserSettings) => {
			this.form.setValue(settings);
		});
	}
	
	ngOnDestroy(): void {
		this.settingsSubscription.unsubscribe();
	}
	
	submit() {
		for (const key in this.form.controls) this.form.controls[key].markAsTouched();
		if (!this.form.valid) return;
		
		// Mark as pending.
		this.pendingSettingsUpdate = true;
		
		// Fire and remove pending state when done.
		this.userService.updateSettings(this.form.value).subscribe((settings: UserSettings) => {
			this.pendingSettingsUpdate = false;
			this.form.setValue(settings);
		}, error => {
			this.pendingSettingsUpdate = false;
			alert(error.message);
		});
	}
}
