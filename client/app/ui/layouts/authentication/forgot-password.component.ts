import {Component, OnInit, ViewChild} from '@angular/core';
import {AvailabilityResult, UserService} from '../../../services/user.service';
import {IndicatorComponent} from '../../widgets/state/indicator.component';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as faker from 'faker';
import {Observable} from "rxjs/Observable";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
	templateUrl: './forgot-password.component.html',
	styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

    form: FormGroup;
    pendingRequest: boolean;
    successfulRequest: boolean;

	constructor(private userService: UserService,
                private route: ActivatedRoute,
	            private fb: FormBuilder) {}
	
	ngOnInit() {
        this.form = this.fb.group({
            mail: [
                null, [
                    Validators.required,
                    Validators.email
                ]
            ]
        });

        this.route.queryParams.subscribe(params => console.log(params));
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
