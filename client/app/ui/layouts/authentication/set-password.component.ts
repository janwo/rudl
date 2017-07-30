import {Component, OnInit, ViewChild} from '@angular/core';
import {AvailabilityResult, UserService} from '../../../services/user.service';
import {IndicatorComponent} from '../../widgets/state/indicator.component';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as faker from 'faker';
import {Observable} from "rxjs/Observable";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
	templateUrl: './set-password.component.html',
	styleUrls: ['./set-password.component.scss']
})
export class SetPasswordComponent implements OnInit {

    form: FormGroup;
    pendingRequest: boolean;
    successfulRequest: boolean;

	constructor(private userService: UserService,
                private route: ActivatedRoute,
	            private fb: FormBuilder) {}
	
	ngOnInit() {
        this.form = this.fb.group({
            password: [
                null, [
                    Validators.required,
                    Validators.minLength(6),
                    Validators.maxLength(32)
                ]
            ],
            confirmPassword: [
                null, [
                    Validators.required,
                    Validators.minLength(6),
                    Validators.maxLength(32)
                ]
            ]
        }, {
            validator: (group: FormGroup) => {
                let passwordField = group.get('password');
                let confirmPasswordField = group.get('confirmPassword');
                let errors = confirmPasswordField.errors;
                if(passwordField.value != confirmPasswordField.value) errors = Object.assign(errors || {}, {
                    nomatch: true
                });
                confirmPasswordField.setErrors(errors);
            }
        });

        this.route.queryParams.subscribe(params => console.log(params));
	}

    formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
        return (value: string) => `${value ? value.length : 0} of ${maxChars} characters used`;
    }

    submit(): void {
        for (const key in this.form.controls) this.form.controls[key].markAsTouched();
        if (!this.form.valid) return;

        // Mark as pending.
        this.pendingRequest = true;

        this.userService.forgotPassword(this.form.value.mail).subscribe(() => {
            this.pendingRequest = false;
            this.successfulRequest = true;
        });
    }
}
