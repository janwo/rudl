import {NgModule, CUSTOM_ELEMENTS_SCHEMA}       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { AppComponent }   from './app.component';
import {LoginComponent} from "./login.component";
import {UserSuggestionsComponent} from "./user-suggestions.component";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
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
