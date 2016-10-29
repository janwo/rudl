import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {LoginComponent} from "./ui/login.component";
import {ExploreComponent} from "./ui/explore.component";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {StyledButtonComponent} from "./ui/widgets/styled-button.component";
import {InputFieldComponent} from "./ui/widgets/input-field.component";
import {AuthCallbackComponent} from "./ui/auth-callback.component";
import {HttpModule, JsonpModule} from "@angular/http";
import {AppGuard} from "./app.guard";
import {DataService} from "./data.service";
import {routing, appRoutingProviders} from "./app.routes";
import {FormsModule} from "@angular/forms";
import {UserService} from "./user.service";
import {IndicatorComponent} from "./ui/widgets/indicator.component";
import {NavbarComponent} from "./ui/navbar.component";
import {DropdownMenuComponent} from "./ui/widgets/dropdown-menu.component";
import {TabMenuComponent} from "./ui/widgets/tab-menu.component";
import {PeopleComponent} from "./ui/people.component";
import {ActivityComponent} from "./ui/activity.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent, RedirectProfileComponent} from "./ui/profile.component";
import {TabElevatedMenuComponent} from "./ui/widgets/tab-elevated-menu.component";
import {ExpanderComponent} from "./ui/widgets/expander.component";
import {MeComponent} from "./ui/me.component";
import {PeopleItemComponent} from "./ui/widgets/people-item.component";
import {StatisticsComponent} from "./ui/widgets/statistics.component";
import {AvatarComponent} from "./ui/widgets/avatar.component";

@NgModule({
    declarations: [
	    AppComponent,
	    LoginComponent,
	    AuthCallbackComponent,
	    StyledButtonComponent,
	    InputFieldComponent,
	    NavbarComponent,
	    DropdownMenuComponent,
	    TabMenuComponent,
	    StatisticsComponent,
	    TabElevatedMenuComponent,
	    LandingPageComponent,
	    IndicatorComponent,
	    DashboardComponent,
	    AvatarComponent,
	    ExploreComponent,
	    PeopleComponent,
	    PeopleItemComponent,
	    MeComponent,
	    ExpanderComponent,
	    ActivityComponent,
	    SettingsComponent,
	    ProfileComponent,
        RedirectProfileComponent
    ],
    providers: [
        UserService,
        DataService,
        AppGuard,
        appRoutingProviders
    ],
    imports: [
        FormsModule,
        HttpModule,
        JsonpModule,
        BrowserModule,
        routing
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
