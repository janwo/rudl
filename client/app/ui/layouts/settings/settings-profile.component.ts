import {Component, OnDestroy, OnInit} from '@angular/core';
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
	validAvatar = true;
	avatarButtonStyle = ButtonStyles.filledInverseShadowed;
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
