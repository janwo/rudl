import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {LoginComponent} from "./ui/widgets/login.component";
import {ExploreComponent} from "./ui/explore.component";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {StyledButtonComponent} from "./ui/widgets/styled-button.component";
import {InputFieldComponent} from "./ui/widgets/input-field.component";
import {HttpModule, JsonpModule} from "@angular/http";
import {LoginGuard} from "./guards/login";
import {DataService} from "./services/data.service";
import {routing, appRoutingProviders} from "./app.routes";
import {FormsModule} from "@angular/forms";
import {UserService} from "./services/user.service";
import {IndicatorComponent} from "./ui/widgets/indicator.component";
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
import {ItemWrapperComponent} from "./ui/widgets/item-wrapper.component";
import {StackCardComponent, StackComponent} from "./ui/widgets/stack.component";
import {ModalComponent} from "./ui/widgets/modal.component";
import {FanComponent} from "./ui/widgets/fan.component";
import {SearchComponent} from "./ui/search.component";
import {HighlightPipe} from "./pipes/highlight.pipe";
import {FormatPipe} from "./pipes/format.pipe";
import {QuestionComponent} from "./ui/widgets/question.component";
import {SearchBarComponent} from "./ui/widgets/search-bar.component";
import {SearchService} from "./services/search.service";
import {CreateActivityComponent} from "./ui/widgets/create-activity.component";
import {CreateListComponent} from "./ui/widgets/create-list.component";
import {CheckboxComponent} from "./ui/widgets/checkbox.component";
import {LegalComponent} from "./ui/legal.component";
import {TranslationListComponent} from "./ui/widgets/translation-list.component";
import {ActivityService} from "./services/activity.service";
import {ListService} from "./services/list.service";
import {AddToListComponent} from "./ui/widgets/add-to-list.component";
import {LogoComponent} from "./ui/widgets/logo.component";
import {MapComponent} from "./ui/widgets/map.component";
import {EventComponent} from "./ui/event.component";
import {SlotsComponent} from "./ui/widgets/slots.component";
import {EventItemComponent} from "./ui/widgets/event-item.component";
import {EventService} from "./services/event.service";
import {BoardingComponent} from "./ui/boarding.component";
import {BoardingGuard} from "./guards/boarding";
import {LoadingComponent} from "./ui/widgets/loading.component";

@NgModule({
    declarations: [
	    AppComponent,
	    LoginComponent,
	    StyledButtonComponent,
	    InputFieldComponent,
	    DropdownMenuComponent,
	    TabMenuComponent,
	    ActivityItemComponent,
	    ItemWrapperComponent,
	    ListComponent,
	    ActivityComponent,
	    StatisticsComponent,
	    SlotsComponent,
	    ModalComponent,
	    QuestionComponent,
	    LogoComponent,
	    TabElevatedMenuComponent,
	    EventComponent,
	    LandingPageComponent,
	    IndicatorComponent,
	    LoadingComponent,
	    DashboardComponent,
	    AvatarComponent,
	    MapComponent,
	    AddToListComponent,
	    ExploreComponent,
	    PeopleComponent,
	    StackComponent,
	    PeopleItemComponent,
	    EventItemComponent,
	    RedirectComponent,
	    ExpanderComponent,
	    HighlightPipe,
	    FormatPipe,
	    ActivityComponent,
	    SettingsComponent,
	    ListItemComponent,
	    StackCardComponent,
	    CreateActivityComponent,
	    CreateListComponent,
	    CheckboxComponent,
	    SearchComponent,
	    SearchBarComponent,
	    LegalComponent,
	    ProfileComponent,
	    BoardingComponent,
        FanComponent,
        TranslationListComponent
    ],
    providers: [
	    UserService,
	    SearchService,
	    ActivityService,
	    ListService,
	    DataService,
	    BoardingGuard,
	    LoginGuard,
	    EventService,
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

