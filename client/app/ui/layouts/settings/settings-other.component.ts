import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService, UserStatus} from '../../../services/user.service';
import {Form, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticatedUser, User} from "../../../models/user";
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {Subscription} from 'rxjs/Subscription';
import {Router} from "@angular/router";

@Component({
	templateUrl: 'settings-other.component.html',
	styleUrls: ['settings-other.component.scss']
})
export class SettingsOtherComponent implements OnInit, OnDestroy {

	pendingTermination = false;
	unlockTermination = false;
	terminationButtonStyle = ButtonStyles.filledInverseShadowed;
	authenticatedUserSubscription: Subscription;
	user: User;
	constructor(public userService: UserService,
                private router: Router) {}

    onUsernameConfirmationKeyUp(input: HTMLInputElement): void {
        this.unlockTermination = input.value == this.user.username;
    }

    resetInput(input: HTMLInputElement): void {
	    input.value = null;
        this.unlockTermination = false;
    }
	
	terminateMembership(): void {
		this.pendingTermination = true;
		this.userService.terminate().subscribe(() => {
			this.pendingTermination = false;
			this.router.navigate(['/membership-terminated']);
		});
	}
	
	ngOnInit() {
		this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
            this.user = userStatus.user;
		});
	}
	
	ngOnDestroy(): void {
		this.authenticatedUserSubscription.unsubscribe();
	}
}
