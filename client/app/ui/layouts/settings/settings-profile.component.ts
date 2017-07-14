import {Component, OnDestroy, OnInit} from '@angular/core';
import {UsernameCheckResult, UserService, UserStatus} from '../../../services/user.service';
import {AbstractControl, Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticatedUser, User} from "../../../models/user";
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from "rxjs/Observable";

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
	usernameSuggestion: string;
	
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

	checkUsername(control: AbstractControl): Observable<{taken: boolean}> {
	    if(control.value == this.userService.getAuthenticatedUser().user.username) return Observable.of(null);
	    return this.userService.checkUsername(control.value).do((result: UsernameCheckResult) => {
	        if(result.suggestion) this.usernameSuggestion = result.suggestion;
        }).map((result: UsernameCheckResult) => result.available ? null : {
            taken: true
        });
    }
	
	ngOnInit() {
		this.form = this.fb.group({
			firstName: [
				null, [
					Validators.required,
					Validators.maxLength(24),
					Validators.pattern(/^\S+.*$/)
				]
			],
			lastName: [
				null, [
					Validators.required,
					Validators.maxLength(24),
                    Validators.pattern(/^\S+.*$/)
				]
			],
			username: [
				null, [
					Validators.required,
					Validators.maxLength(24),
                    Validators.minLength(5),
                    Validators.pattern(/^[a-z0-9_]*$/)
				], [
                    this.checkUsername.bind(this)
                ]
			],
			profileText: [
				null, [
					Validators.maxLength(60)
				]
			]
		});
		
		this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
				this.user = userStatus.user;
				this.form.setValue({
				    firstName: userStatus.user.firstName,
                    lastName: userStatus.user.lastName,
                    username: userStatus.user.username,
				    profileText: userStatus.user.profileText
			});
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
				profileText: user.profileText,
                username: user.username
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
