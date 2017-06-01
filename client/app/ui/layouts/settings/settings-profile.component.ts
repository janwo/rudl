import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService, UserStatus} from '../../../services/user.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {User} from "../../../models/user";
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {Subscription} from 'rxjs/Subscription';

@Component({
	templateUrl: 'settings-profile.component.html',
	styleUrls: ['settings-profile.component.scss']
})
export class SettingsProfileComponent implements OnInit, OnDestroy {
	
	form: FormGroup;
	user: User;
	pendingAvatarUpload = false;
	avatarButtonStyle = ButtonStyles.filledInverseShadowed;
	authenticatedUserSubscription: Subscription;
	
	constructor(public userService: UserService,
	            private fb: FormBuilder ) {}
	
	onChangedAvatar(input: HTMLInputElement): void {
		if(input.files && input.files[0]) {
			this.pendingAvatarUpload = true;
			this.userService.updateAvatar(input.files[0]).subscribe(() => {
				this.pendingAvatarUpload = false;
			});
		}
	}
	
	onDeleteAvatar(): void {
		this.pendingAvatarUpload = true;
		this.userService.updateAvatar(null).subscribe(() => {
			this.pendingAvatarUpload = false;
		});
	}
	
	ngOnInit() {
		this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
			this.user = userStatus.user;
		});
		this.form = this.fb.group({
			firstName: [
				this.user.firstName, [
					Validators.required,
					Validators.maxLength(24),
					Validators.pattern(/^[a-z0-9\s]*$/i)
				]
			],
			lastName: [
				this.user.lastName, [
					Validators.required,
					Validators.maxLength(24),
					Validators.pattern(/^[a-z0-9\s]*$/i)
				]
			],
			profileText: [
				this.user.profileText, [
					Validators.maxLength(60),
					Validators.pattern(/^[a-z0-9\s]*$/i)
				]
			]
		});
	}
	
	ngOnDestroy(): void {
		this.authenticatedUserSubscription.unsubscribe();
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value ? value.length : 0} of ${maxChars} characters used`;
	}
}
