import {Component, OnInit, ViewChild} from '@angular/core';
import {AvailabilityResult, UserService} from '../../../services/user.service';
import {IndicatorComponent} from '../../widgets/state/indicator.component';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as faker from 'faker';
import {Observable} from "rxjs/Observable";
import {Router} from "@angular/router";

@Component({
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

    form: FormGroup;
    expanded: boolean;
	googleButtonStyle: ButtonStyles = ButtonStyles.google;
	facebookButtonStyle: ButtonStyles = ButtonStyles.facebook;
	pendingRequest: boolean;
    loginFailed: boolean;
	
	constructor(private userService: UserService,
                private router: Router,
	            private fb: FormBuilder) {}
	
	ngOnInit() {
        this.form = this.fb.group({
            mail: [
                null, [
                    Validators.required,
                    Validators.email
                ]
            ],
            password: [
                null, [
                    Validators.required,
                    Validators.minLength(6),
                    Validators.maxLength(32)
                ]
            ]
        });
	}

    expand(): boolean {
	    let changed = !this.expanded;
        this.expanded = true;
        return changed;
    }

	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value ? value.length : 0} of ${maxChars} characters used`;
	}

    submit(): void {
        for (const key in this.form.controls) this.form.controls[key].markAsTouched();
        if (!this.form.valid) return;

        // Mark as pending.
        this.pendingRequest = true;
        this.loginFailed = false;

        this.userService.signIn(this.form.value).subscribe(success => {
            this.pendingRequest = false;
            this.loginFailed = !success;
            if(success) this.router.navigate(['/']);
        }, );
    }
}
