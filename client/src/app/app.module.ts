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
import {HeaderComponent} from "./ui/header.component";
import {PopupMenuComponent} from "./ui/widgets/popup-menu.component";
import {TabMenuComponent} from "./ui/widgets/tab-menu.component";
import {PeopleComponent} from "./ui/people.component";
import {ActivityComponent} from "./ui/activity.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent} from "./ui/profile.component";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        AuthCallbackComponent,
        StyledButtonComponent,
        InputFieldComponent,
        HeaderComponent,
        PopupMenuComponent,
        TabMenuComponent,
        LandingPageComponent,
        IndicatorComponent,
        DashboardComponent,
        ExploreComponent,
        PeopleComponent,
        ActivityComponent,
        SettingsComponent,
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
