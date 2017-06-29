import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService, UserStatus} from '../../../services/user.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticatedUser, User} from "../../../models/user";
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
	pendingProfileUpdate = false;
	validAvatar = true;
	avatarSubmitButtonStyle = ButtonStyles.filledInverseShadowed;
	profileSubmitButtonStyle = ButtonStyles.outlined;
	authenticatedUserSubscription: Subscription;
	uploadMimeTypes = process.env.UPLOAD_MIME_TYPES;
	maxUploadBytes = process.env.MAX_UPLOAD_BYTES;
	
	constructor(public userService: UserService,
	            private fb: FormBuilder ) {}
	
	onChangedAvatar(input: HTMLInputElement): void {
		this.validAvatar = true;
		this.pendingAvatarUpload = true;
		
		// Validate file.
		let file = input.files ? input.files[0] : undefined;
		if(!file || !this.uploadMimeTypes.some((mime: string) => mime == file.type.toLowerCase()) || file.size > this.maxUploadBytes.avatars) {
			this.validAvatar = false;
			this.pendingAvatarUpload = false;
			return;
		}
		
		// Upload.
		this.userService.updateAvatar(input.files[0]).subscribe(() => {
			this.pendingAvatarUpload = false;
		});
	}
	
	onDeleteAvatar(): void {
		this.pendingAvatarUpload = true;
		this.userService.updateAvatar(null).subscribe(() => {
			this.pendingAvatarUpload = false;
		});
	}
	
	ngOnInit() {
		this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
			this.form.setValue({
				firstName: userStatus.user.firstName,
				lastName: userStatus.user.lastName,
				profileText: userStatus.user.profileText
			});
		});
		
		this.form = this.fb.group({
			firstName: [
				null, [
					Validators.required,
					Validators.maxLength(24)
				]
			],
			lastName: [
				null, [
					Validators.required,
					Validators.maxLength(24)
				]
			],
			profileText: [
				null, [
					Validators.maxLength(60)
				]
			]
		});
	}
	
	ngOnDestroy(): void {
		this.authenticatedUserSubscription.unsubscribe();
	}
	
	submit() {
		for (const key in this.form.controls) this.form.controls[key].markAsTouched();
		if (!this.form.valid) return;
		
		// Mark as pending.
		this.pendingProfileUpdate = true;
		
		// Fire and remove pending state when done.
		this.userService.update(this.form.value).subscribe((user: AuthenticatedUser) => {
			this.pendingProfileUpdate = false;
			this.form.setValue({
				firstName: user.firstName,
				lastName: user.lastName,
				profileText: user.profileText
			});
		}, error => {
			this.pendingProfileUpdate = false;
			alert(error.message);
		});
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value ? value.length : 0} of ${maxChars} characters used`;
	}
}
