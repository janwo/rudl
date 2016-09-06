import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {LoginComponent} from "./ui/login.component";
import {UserSuggestionsComponent} from "./ui/user-suggestions.component";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {StyledButtonComponent} from "./ui/widgets/styled-button.component";
import {InputFieldComponent} from "./ui/input-field.component";
import {AuthCallbackComponent} from "./ui/auth-callback.component";
import {HttpModule, JsonpModule} from "@angular/http";
import {AppGuard} from "./app.guard";
import {DataService} from "./data.service";
import {routing, appRoutingProviders} from "./app.routes";
import {FormsModule} from "@angular/forms";
import {AuthService} from "./auth.service";
import {IndicatorComponent} from "./ui/widgets/indicator.component";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        AuthCallbackComponent,
        StyledButtonComponent,
        InputFieldComponent,
        LandingPageComponent,
        IndicatorComponent,
        DashboardComponent,
        UserSuggestionsComponent
    ],
    providers: [
        AuthService,
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
