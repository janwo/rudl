import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {LoginComponent} from "./ui/widgets/login.component";
import {ExploreComponent} from "./ui/layouts/explore/explore.component";
import {DashboardComponent} from "./ui/layouts/dashboard/dashboard.component";
import {StyledButtonComponent} from "./ui/widgets/control/styled-button.component";
import {HttpModule, JsonpModule} from "@angular/http";
import {LoginGuard} from "./guards/login";
import {DataService} from "./services/data.service";
import {appRoutingProviders, routing} from "./app.routes";
import {ReactiveFormsModule} from "@angular/forms";
import {ActivityResolver} from "./resolver/activity";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {UserService} from "./services/user.service";
import {IndicatorComponent} from "./ui/widgets/state/indicator.component";
import {DropdownMenuComponent} from "./ui/widgets/menu/dropdown-menu.component";
import {MenuComponent} from "./ui/widgets/menu/menu.component";
import {PeopleComponent} from "./ui/layouts/people/people.component";
import {ActivityComponent} from "./ui/layouts/activity/activity.component";
import {SettingsComponent} from "./ui/layouts/settings/settings.component";
import {ExpanderComponent} from "./ui/widgets/control/expander.component";
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
import {CheckboxComponent} from "./ui/widgets/control/form/checkbox.component";
import {LegalComponent} from "./ui/layouts/legal/legal.component";
import {TranslationListComponent} from "./ui/widgets/translation/translation-list.component";
import {ActivityService} from "./services/activity.service";
import {ListService} from "./services/list.service";
import {AddToListComponent} from "./ui/widgets/list/add-to-list.component";
import {LogoComponent} from "./ui/widgets/logo.component";
import {MapComponent} from "./ui/widgets/map/map.component";
import {SlotsComponent} from "./ui/widgets/expedition/slots.component";
import {BoardingComponent} from "./ui/layouts/boarding/boarding.component";
import {BoardingGuard} from "./guards/boarding";
import {LoadingComponent} from "./ui/widgets/state/loading.component";
import {EmptyComponent} from "./ui/widgets/state/empty.component";
import {MenuItemComponent} from "./ui/widgets/menu/menu-item.component";
import {LandingComponent} from "./ui/layouts/landing/landing.component";
import {UserComponent} from "./ui/layouts/user/user.component";
import {UserActivitiesComponent} from "./ui/layouts/user/user-activities.component";
import {UserFolloweesComponent} from "./ui/layouts/user/user-followees.component";
import {UserFollowersComponent} from "./ui/layouts/user/user-followers.component";
import {UserListsComponent} from "./ui/layouts/user/user-lists.component";
import {UserAvatarComponent} from "./ui/widgets/user/user-avatar.component";
import {UserItemComponent} from "./ui/widgets/user/user-item.component";
import {DateTimeComponent} from "./ui/widgets/control/form/datetime.component";
import {GeocodeService} from "./services/geocode.service";
import {LocationSearchComponent} from "./ui/widgets/control/location-search.component";
import {CoordinatesPipe} from "./pipes/coordinates.pipe";
import {InviteComponent} from "./ui/widgets/control/form/invite.component";
import {FormControlWrapper} from "./ui/widgets/control/form/form-control-wrapper.component";
import {LocationPickerComponent} from "./ui/widgets/control/form/location-picker.component";
import {UserResolver} from "./resolver/user";
import {ListResolver} from "./resolver/list";
import {ExpeditionComponent} from "./ui/layouts/expedition/expedition.component";
import {ExpeditionService} from "./services/expedition.service";
import {ExpeditionResolver} from "./resolver/expedition";
import {ExpeditionItemComponent} from "./ui/widgets/expedition/expedition-item.component";
import {EmojiComponent} from "./ui/widgets/emoji.component";
import {EmojiPickerComponent} from "./ui/widgets/control/form/emoji-picker.component";
import {UtilService} from "./services/util.service";
import {KeysPipe} from "./pipes/keys.pipe";
import {SafePipe} from "./pipes/safe.pipe";
import {ActivityEditComponent} from "./ui/layouts/activity/activity-edit.component";
import {ActivityExpeditionsComponent} from "./ui/layouts/activity/activity-expeditions.component";
import {ActivityCreateExpeditionComponent} from "./ui/layouts/activity/activity-create-expedition.component";
import {ActivityAddToListComponent} from "./ui/layouts/activity/activity-add-to-list.component";
import {ActivityFollowersComponent} from "./ui/layouts/activity/activity-followers.component";
import {ListFollowersComponent} from "./ui/layouts/list/list-followers.component";
import {ListActivitiesComponent} from "./ui/layouts/list/list-activities.component";
import {CarouselComponent} from "./ui/widgets/wrapper/carousel.component";
import {NotFoundComponent} from "./ui/layouts/404/404.component";
import {ExpeditionCommentsComponent} from './ui/layouts/expedition/expedition-comments.component';
import {ExpeditionDetailsComponent} from './ui/layouts/expedition/expedition-details.component';
import {ExpeditionForbiddenComponent} from "./ui/layouts/expedition/expedition-forbidden.component";
import {CommentService} from './services/comment.service';

@NgModule({
    declarations: [
	    AppComponent,
	    LoginComponent,
	    StyledButtonComponent,
	    CarouselComponent,
	    DropdownMenuComponent,
	    ActivityItemComponent,
	    ItemWrapperComponent,
	    ListComponent,
	    ActivityComponent,
	    StatisticsComponent,
	    SlotsComponent,
	    ModalComponent,
	    QuestionComponent,
	    LogoComponent,
	    ExpeditionItemComponent,
	    LocationPickerComponent,
	    MenuComponent,
	    EmojiPickerComponent,
	    MenuItemComponent,
	    EmojiComponent,
	    ExpeditionComponent,
	    LandingComponent,
	    IndicatorComponent,
	    EmptyComponent,
	    LoadingComponent,
	    DashboardComponent,
	    ActivityEditComponent,
	    ActivityCreateExpeditionComponent,
	    ActivityExpeditionsComponent,
	    ActivityFollowersComponent,
	    ActivityAddToListComponent,
	    UserAvatarComponent,
	    ExpeditionCommentsComponent,
	    ExpeditionDetailsComponent,
	    ExpeditionForbiddenComponent,
	    MapComponent,
	    AddToListComponent,
	    ExploreComponent,
	    PeopleComponent,
	    StackComponent,
	    UserItemComponent,
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
	    InviteComponent,
	    SearchComponent,
	    CoordinatesPipe,
	    SearchBarComponent,
	    NotFoundComponent,
	    LegalComponent,
	    FormControlWrapper,
	    UserComponent,
	    UserActivitiesComponent,
	    UserFolloweesComponent,
	    KeysPipe,
	    UserFollowersComponent,
	    UserListsComponent,
	    BoardingComponent,
	    ListFollowersComponent,
	    ListActivitiesComponent,
	    FanComponent,
	    LocationSearchComponent,
	    SafePipe,
	    TranslationListComponent,
	    DateTimeComponent
    ],
    providers: [
	    UserService,
	    SearchService,
	    ActivityService,
	    ListService,
	    DataService,
	    BoardingGuard,
	    GeocodeService,
	    UtilService,
	    ActivityResolver,
	    LoginGuard,
	    UserResolver,
	    ExpeditionResolver,
	    ListResolver,
	    ExpeditionService,
	    CommentService,
	    appRoutingProviders
    ],
    imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
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

