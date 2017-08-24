import {Component, OnInit, ViewChild} from '@angular/core';
import {AvailabilityResult, UserService} from '../../../services/user.service';
import {IndicatorComponent} from '../../widgets/state/indicator.component';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as faker from 'faker';
import {Observable} from "rxjs/Observable";
import {Router} from "@angular/router";

@Component({
	templateUrl: 'sign-up.component.html',
	styleUrls: ['sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

    form: FormGroup;
    expanded: boolean;
	googleButtonStyle: ButtonStyles = ButtonStyles.google;
	facebookButtonStyle: ButtonStyles = ButtonStyles.facebook;
	pendingRequest: boolean;
    registerFailed: boolean;
    usernameSuggestion: string;
	placeholders = {
		username: `Wie wäre es mit ${faker.internet.userName().toLowerCase().replace(/[^0-9a-z]/, '_')}?`,
		password: `Sei kreativ!`,
		firstName: `Lass mich raten, ${faker.name.firstName()}?`,
		lastName: `...${faker.name.lastName()}?`,
		mail: 'z.B. ' + faker.internet.exampleEmail()
	};
	
	constructor(private userService: UserService,
                private router: Router,
	            private fb: FormBuilder) {}
	
	ngOnInit() {
        this.form = this.fb.group({
            username: [
                null, [
                    Validators.required,
                    Validators.minLength(5),
                    Validators.maxLength(16),
                    Validators.pattern(/^[a-z0-9_]*$/)
                ], [
                    this.checkUsername.bind(this)
                ]
            ],
            mail: [
                null, [
                    Validators.required,
                    Validators.email
                ], [
                    this.checkMail.bind(this)
                ]
            ],
            password: [
                null, [
                    Validators.required,
                    Validators.minLength(6),
                    Validators.maxLength(32)
                ]
            ],
            firstName: [
                null, [
                    Validators.maxLength(24),
                    Validators.required
                ]
            ],
            lastName: [
                null, [
                    Validators.maxLength(24),
                    Validators.required
                ]
            ]
        });
	}

    checkUsername(control: AbstractControl): Observable<{taken: boolean}> {
        return this.userService.checkUsername(control.value).do((result: AvailabilityResult) => {
            if(result.suggestion) this.usernameSuggestion = result.suggestion;
        }).map((result: AvailabilityResult) => result.available ? null : {
            taken: true
        });
    }

    checkMail(control: AbstractControl): Observable<{taken: boolean}> {
        return this.userService.checkMail(control.value).map((result: AvailabilityResult) => result.available ? null : {
            taken: true
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
        this.registerFailed = false;

        this.userService.signUp(this.form.value).subscribe(success => {
            this.pendingRequest = false;
            this.registerFailed = !success;
        });
    }
}
