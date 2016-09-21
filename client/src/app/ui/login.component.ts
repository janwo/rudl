import {Component, ViewChild} from "@angular/core";
import {UserService} from "../user.service";
import {IndicatorComponent} from "./widgets/indicator.component";

@Component({
    template: require('./login.component.html'),
    styles: [require('./login.component.scss')],
    selector: 'login'
})
export class LoginComponent {
    
    isCollapsed: boolean = true;
    signInOnly: boolean = false;

    @ViewChild(IndicatorComponent)
    indicatorComponent: IndicatorComponent;

    constructor(
        private userService: UserService
    ) {}

    onToggleMethod() {
        // Unfold, if not done already.
        if (this.isCollapsed) this.isCollapsed = false;

        // Toggle method.
        this.signInOnly = !this.signInOnly;

        // Reset selected index of the indicator.
        this.indicatorComponent.selectedIndex = 0;
    }

    onClickMailButton() {
        // Increase indicator on click.
        if (!this.isCollapsed && this.indicatorComponent.selectedIndex == 0) this.indicatorComponent.selectedIndex++;

        // Unfold, if not done already.
        if (this.isCollapsed) this.isCollapsed = false;

        // Try to register user.
        this.userService.signUp('user', 'pwd');
    }
}
