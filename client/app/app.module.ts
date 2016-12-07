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
import {DataService} from "./services/data.service";
import {routing, appRoutingProviders} from "./app.routes";
import {FormsModule} from "@angular/forms";
import {UserService} from "./services/user.service";
import {IndicatorComponent} from "./ui/widgets/indicator.component";
import {NavbarComponent} from "./ui/navbar.component";
import {DropdownMenuComponent} from "./ui/widgets/dropdown-menu.component";
import {TabMenuComponent} from "./ui/widgets/tab-menu.component";
import {PeopleComponent} from "./ui/people.component";
import {ActivityComponent} from "./ui/activity.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent} from "./ui/profile.component";
import {TabElevatedMenuComponent} from "./ui/widgets/tab-elevated-menu.component";
import {ExpanderComponent} from "./ui/widgets/expander.component";
import {PeopleItemComponent} from "./ui/widgets/people-item.component";
import {StatisticsComponent} from "./ui/widgets/statistics.component";
import {AvatarComponent} from "./ui/widgets/avatar.component";
import {RedirectComponent} from "./redirect.component";
import {ListItemComponent} from "./ui/widgets/list-item.component";
import {ListComponent} from "./ui/list.component";
import {ActivityItemComponent} from "./ui/widgets/activity-item.component";
import {ListWrapperComponent} from "./ui/widgets/list-wrapper.component";
import {StackCardComponent, StackComponent} from "./ui/widgets/stack.component";
import {ModalComponent} from "./ui/widgets/modal.component";

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
	    ActivityItemComponent,
	    ListWrapperComponent,
	    ListComponent,
	    StatisticsComponent,
	    ModalComponent,
	    TabElevatedMenuComponent,
	    LandingPageComponent,
	    IndicatorComponent,
	    DashboardComponent,
	    AvatarComponent,
	    ExploreComponent,
	    PeopleComponent,
	    StackComponent,
	    PeopleItemComponent,
	    RedirectComponent,
	    ExpanderComponent,
	    ActivityComponent,
	    SettingsComponent,
	    ListItemComponent,
	    StackCardComponent,
	    ProfileComponent
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

