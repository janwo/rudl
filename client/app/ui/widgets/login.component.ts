import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {IndicatorComponent} from './state/indicator.component';
import {ButtonStyles} from './control/styled-button.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as faker from 'faker';

@Component({
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	selector: 'login'
})
export class LoginComponent implements OnInit {
	
	user: FormGroup;
	isCollapsed: boolean = true;
	signInOnly: boolean = false;
	googleButtonStyle: ButtonStyles = ButtonStyles.google;
	facebookButtonStyle: ButtonStyles = ButtonStyles.facebook;
	@ViewChild(IndicatorComponent) indicatorComponent: IndicatorComponent;
	placeholders = {
		username: `Wie wäre es mit ${faker.internet.userName().toLowerCase().replace(/[^0-9a-z_-]/, '-')}?`,
		password: `Sei kreativ!`,
		firstName: `Lass mich raten, ${faker.name.firstName()}?`,
		lastName: `...${faker.name.lastName()}?`,
		mail: faker.internet.exampleEmail()
	};
	
	constructor(private userService: UserService,
	            private fb: FormBuilder) {}
	
	ngOnInit() {
		this.user = this.fb.group({
			username: [
				null, [
					Validators.required,
					Validators.minLength(5),
					Validators.maxLength(16),
					Validators.pattern(/^[a-z0-9_]*$/)
				]
			],
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
	
	onToggleMethod() {
		// Unfold, if not done already.
		if (this.isCollapsed) this.isCollapsed = false;
		
		// Toggle method.
		this.signInOnly = !this.signInOnly;
		
		// Reset selected index of the indicator.
		this.indicatorComponent.selectedStep = 0;
	}
	
	onClickMailButton() {
		// Increase indicator on click.
		if (!this.isCollapsed && this.indicatorComponent.selectedStep == 0) this.indicatorComponent.selectedStep++;
		
		// Unfold, if not done already.
		if (this.isCollapsed) this.isCollapsed = false;
		
		// Try to register user.
		this.userService.signUp('user', 'pwd');
	}
}
