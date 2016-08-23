import {NgModule}       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { AppComponent }   from './app.component';
import {LoginComponent} from "./ui/login.component";
import {UserSuggestionsComponent} from "./ui/user-suggestions.component";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {ButtonComponent} from "./ui/widgets/button.component";
import {InputFieldComponent} from "./ui/input-field.component";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ButtonComponent,
        InputFieldComponent,
        LandingPageComponent,
        DashboardComponent,
        UserSuggestionsComponent
    ],
    imports: [
        BrowserModule
    ],
    bootstrap: [
        AppComponent
    ],
})
export class AppModule {}
