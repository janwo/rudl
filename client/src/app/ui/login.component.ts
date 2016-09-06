import {Component, ViewChild} from "@angular/core";
import {AuthService} from "../auth.service";
import {IndicatorComponent} from "./widgets/indicator.component";

@Component({
    template: require('./login.component.html'),
    styles: [require('./login.component.scss')],
    selector: 'login'
})
export class LoginComponent {

    private authService: AuthService;
    private isCollapsed: boolean = true;
    private signInOnly: boolean = false;

    @ViewChild(IndicatorComponent)
    private indicatorComponent: IndicatorComponent;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    public onToggleMethod() {
        // Unfold, if not done already.
        if (this.isCollapsed) this.isCollapsed = false;

        // Toggle method.
        this.signInOnly = !this.signInOnly;

        // Reset selected index of the indicator.
        this.indicatorComponent.selectedIndex = 0;
    }

    public onClickMailButton() {
        // Increase indicator on click.
        if (!this.isCollapsed && this.indicatorComponent.selectedIndex == 0) this.indicatorComponent.selectedIndex++;

        // Unfold, if not done already.
        if (this.isCollapsed) this.isCollapsed = false;

        // Try to register user.
        this.authService.signUp('user', 'pwd');
    }
}
