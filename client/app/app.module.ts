import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {LoginComponent} from "./ui/widgets/login.component";
import {ExploreComponent} from "./ui/layouts/explore/explore.component";
import {DashboardComponent} from "./ui/layouts/dashboard/dashboard.component";
import {StyledButtonComponent} from "./ui/widgets/controls/styled-button.component";
import {InputFieldComponent} from "./ui/widgets/controls/input-field.component";
import {HttpModule, JsonpModule} from "@angular/http";
import {LoginGuard} from "./guards/login";
import {DataService} from "./services/data.service";
import {routing, appRoutingProviders} from "./app.routes";
import {FormsModule} from "@angular/forms";
import {UserService} from "./services/user.service";
import {IndicatorComponent} from "./ui/widgets/state/indicator.component";
import {DropdownMenuComponent} from "./ui/widgets/menus/dropdown-menu.component";
import {MenuComponent} from "./ui/widgets/menus/menu.component";
import {PeopleComponent} from "./ui/layouts/people/people.component";
import {ActivityComponent} from "./ui/layouts/activity/activity.component";
import {SettingsComponent} from "./ui/layouts/settings/settings.component";
import {ExpanderComponent} from "./ui/widgets/controls/expander.component";
import {StatisticsComponent} from "./ui/widgets/statistics.component";
import {RedirectComponent} from "./redirect.component";
import {ListItemComponent} from "./ui/widgets/list/list-item.component";
import {ListComponent} from "./ui/layouts/list/list.component";
import {ActivityItemComponent} from "./ui/widgets/activity/activity-item.component";
import {ItemWrapperComponent} from "./ui/widgets/wrapper/item-wrapper.component";
import {StackCardComponent, StackComponent} from "./ui/widgets/stack/stack.component";
import {ModalComponent} from "./ui/widgets/modal/modal.component";
import {FanComponent} from "./ui/widgets/wrapper/fan.component";
import {SearchComponent} from "./ui/layouts/search/search.component";
import {HighlightPipe} from "./pipes/highlight.pipe";
import {FormatPipe} from "./pipes/format.pipe";
import {QuestionComponent} from "./ui/widgets/modal/question.component";
import {SearchBarComponent} from "./ui/widgets/search/search-bar.component";
import {SearchService} from "./services/search.service";
import {CreateActivityComponent} from "./ui/widgets/activity/create-activity.component";
import {CreateListComponent} from "./ui/widgets/list/create-list.component";
import {CheckboxComponent} from "./ui/widgets/controls/checkbox.component";
import {LegalComponent} from "./ui/layouts/legal/legal.component";
import {TranslationListComponent} from "./ui/widgets/translation/translation-list.component";
import {ActivityService} from "./services/activity.service";
import {ListService} from "./services/list.service";
import {AddToListComponent} from "./ui/widgets/list/add-to-list.component";
import {LogoComponent} from "./ui/widgets/logo.component";
import {MapComponent} from "./ui/widgets/map/map.component";
import {EventComponent} from "./ui/layouts/event/event.component";
import {SlotsComponent} from "./ui/widgets/event/slots.component";
import {EventItemComponent} from "./ui/widgets/event/event-item.component";
import {EventService} from "./services/event.service";
import {BoardingComponent} from "./ui/layouts/boarding/boarding.component";
import {BoardingGuard} from "./guards/boarding";
import {LoadingComponent} from "./ui/widgets/state/loading.component";
import {EmptyComponent} from "./ui/widgets/state/empty.component";
import {MenuItemComponent} from "./ui/widgets/menus/menu-item.component";
import {CreateEventComponent} from "./ui/widgets/event/create-event.component";
import {LandingComponent} from "./ui/layouts/landing/landing.component";
import {ActivityNearbyEventsComponent} from "./ui/layouts/activity/activity-nearby-events.component";
import {ActivityPastEventsComponent} from "./ui/layouts/activity/activity-past-events.component";
import {ActivityUserEventsComponent} from "./ui/layouts/activity/activity-user-events.component";
import {UserComponent} from "./ui/layouts/user/user.component";
import {UserActivitiesComponent} from "./ui/layouts/user/user-activities.component";
import {UserFolloweesComponent} from "./ui/layouts/user/user-followees.component";
import {UserFollowersComponent} from "./ui/layouts/user/user-followers.component";
import {UserListsComponent} from "./ui/layouts/user/user-lists.component";
import {UserAvatarComponent} from "./ui/widgets/user/user-avatar.component";
import {UserItemComponent} from "./ui/widgets/user/user-item.component";

@NgModule({
    declarations: [
	    AppComponent,
	    LoginComponent,
	    StyledButtonComponent,
	    InputFieldComponent,
	    DropdownMenuComponent,
	    ActivityItemComponent,
	    ItemWrapperComponent,
	    ListComponent,
	    ActivityComponent,
	    ActivityNearbyEventsComponent,
	    ActivityPastEventsComponent,
	    ActivityUserEventsComponent,
	    StatisticsComponent,
	    SlotsComponent,
	    ModalComponent,
	    QuestionComponent,
	    LogoComponent,
	    MenuComponent,
	    MenuItemComponent,
	    EventComponent,
	    LandingComponent,
	    IndicatorComponent,
	    EmptyComponent,
	    LoadingComponent,
	    DashboardComponent,
	    UserAvatarComponent,
	    MapComponent,
	    AddToListComponent,
	    ExploreComponent,
	    PeopleComponent,
	    StackComponent,
	    UserItemComponent,
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
	    CreateEventComponent,
	    LegalComponent,
	    UserComponent,
	    UserActivitiesComponent,
	    UserFolloweesComponent,
	    UserFollowersComponent,
	    UserListsComponent,
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

