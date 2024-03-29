import {NgModule} from '@angular/core';
import {AppComponent} from './ui/app.component';
import {ExploreComponent} from './ui/layouts/explore/explore.component';
import {DashboardComponent} from './ui/layouts/dashboard/dashboard.component';
import {StyledButtonComponent} from './ui/widgets/control/styled-button.component';
import {HttpModule, JsonpModule} from '@angular/http';
import {LoginGuard} from './guards/login';
import {DataService} from './services/data.service';
import {appRoutingProviders, routing} from './app.routes';
import {ReactiveFormsModule} from '@angular/forms';
import {RudelResolver} from './resolver/rudel';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {UserService} from './services/user.service';
import {IndicatorComponent} from './ui/widgets/state/indicator.component';
import {DropdownMenuComponent} from './ui/widgets/menu/dropdown-menu.component';
import {MenuComponent} from './ui/widgets/menu/menu.component';
import {ExpeditionsComponent} from './ui/layouts/expedition/expeditions.component';
import {RudelComponent} from './ui/layouts/rudel/rudel.component';
import {SettingsComponent} from './ui/layouts/settings/settings.component';
import {ExpanderComponent} from './ui/widgets/control/expander.component';
import {StatisticsComponent} from './ui/widgets/statistics.component';
import {RedirectComponent} from './redirect.component';
import {ListItemComponent} from './ui/widgets/list/list-item.component';
import {ListComponent} from './ui/layouts/list/list.component';
import {RudelItemComponent} from './ui/widgets/rudel/rudel-item.component';
import {ItemWrapperComponent} from './ui/widgets/wrapper/item-wrapper.component';
import {StackCardComponent, StackComponent} from './ui/widgets/stack/stack.component';
import {ModalComponent} from './ui/widgets/modal/modal.component';
import {SearchComponent} from './ui/layouts/search/search.component';
import {HighlightPipe} from './pipes/highlight.pipe';
import {FormatPipe} from './pipes/format.pipe';
import {QuestionComponent} from './ui/widgets/modal/question.component';
import {SearchBarComponent} from './ui/widgets/search/search-bar.component';
import {SearchService} from './services/search.service';
import {CreateRudelComponent} from './ui/widgets/rudel/create-rudel.component';
import {CreateListComponent} from './ui/widgets/list/create-list.component';
import {CheckboxComponent} from './ui/widgets/control/form/checkbox.component';
import {LegalComponent} from './ui/layouts/legal/legal.component';
import {TranslationListComponent} from './ui/widgets/translation/translation-list.component';
import {RudelService} from './services/rudel.service';
import {ListService} from './services/list.service';
import {AddToListComponent} from './ui/widgets/list/add-to-list.component';
import {LogoComponent} from './ui/widgets/logo.component';
import {MapComponent} from './ui/widgets/map/map.component';
import {SlotsComponent} from './ui/widgets/expedition/slots.component';
import {BoardingComponent} from './ui/layouts/boarding/boarding.component';
import {BoardingGuard} from './guards/boarding';
import {LoadingComponent} from './ui/widgets/state/loading.component';
import {EmptyComponent} from './ui/widgets/state/empty.component';
import {MenuItemComponent} from './ui/widgets/menu/menu-item.component';
import {LandingComponent} from './ui/layouts/landing/landing.component';
import {UserComponent} from './ui/layouts/user/user.component';
import {UserRudelComponent} from './ui/layouts/user/user-rudel.component';
import {UserLikeesComponent} from './ui/layouts/user/user-likees.component';
import {UserLikersComponent} from './ui/layouts/user/user-likers.component';
import {UserListsComponent} from './ui/layouts/user/user-lists.component';
import {UserAvatarComponent} from './ui/widgets/user/user-avatar.component';
import {UserItemComponent} from './ui/widgets/user/user-item.component';
import {DateTimeComponent} from './ui/widgets/control/form/datetime.component';
import {GeocodeService} from './services/geocode.service';
import {LocationSearchComponent} from './ui/widgets/control/location-search.component';
import {CoordinatesPipe} from './pipes/coordinates.pipe';
import {FormControlWrapper} from './ui/widgets/control/form/form-control-wrapper.component';
import {LocationPickerComponent} from './ui/widgets/control/form/location-picker.component';
import {UserResolver} from './resolver/user';
import {ListResolver} from './resolver/list';
import {ExpeditionComponent} from './ui/layouts/expedition/expedition.component';
import {ExpeditionService} from './services/expedition.service';
import {ExpeditionResolver} from './resolver/expedition';
import {ExpeditionItemComponent} from './ui/widgets/expedition/expedition-item.component';
import {EmojiComponent} from './ui/widgets/emoji.component';
import {EmojiPickerComponent} from './ui/widgets/control/form/emoji-picker.component';
import {UtilService} from './services/util.service';
import {KeysPipe} from './pipes/keys.pipe';
import {SafePipe} from './pipes/safe.pipe';
import {RudelEditComponent} from './ui/layouts/rudel/rudel-edit.component';
import {RudelUpcomingExpeditionsComponent} from './ui/layouts/rudel/rudel-upcoming-expeditions.component';
import {RudelDoneExpeditionsComponent} from './ui/layouts/rudel/rudel-done-expeditions.component';
import {RudelCreateExpeditionComponent} from './ui/layouts/rudel/rudel-create-expedition.component';
import {RudelAddToListComponent} from './ui/layouts/rudel/rudel-add-to-list.component';
import {RudelLikersComponent} from './ui/layouts/rudel/rudel-likers.component';
import {ListLikersComponent} from './ui/layouts/list/list-likers.component';
import {ListRudelComponent} from './ui/layouts/list/list-rudel.component';
import {CarouselComponent, CarouselSlideComponent} from './ui/widgets/wrapper/carousel.component';
import {NotFoundComponent} from './ui/layouts/404/404.component';
import {ExpeditionCommentsComponent} from './ui/layouts/expedition/expedition-comments.component';
import {ExpeditionAttendeesComponent} from './ui/layouts/expedition/expedition-attendees.component';
import {ExpeditionMapComponent} from './ui/layouts/expedition/expedition-map.component';
import {CommentService} from './services/comment.service';
import {FooterComponent} from './ui/widgets/footer/footer.component';
import {CommentItemComponent} from './ui/widgets/comment/comment-item.component';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {ScrollService} from './services/scroll.service';
import {SettingsProfileComponent} from './ui/layouts/settings/settings-profile.component';
import {ArrayPipe} from './pipes/array.pipe';
import {NotificationsComponent} from './ui/layouts/notification/notifications.component';
import {NotificationItemComponent} from "./ui/widgets/notification/notification-item.component";
import {ExpeditionsDoneComponent} from './ui/layouts/expedition/expeditions-done.component';
import {ExpeditionsUpcomingComponent} from './ui/layouts/expedition/expeditions-upcoming.component';
import {LegalAboutComponent} from './ui/layouts/legal/legal-about.component';
import {LegalTermsComponent} from './ui/layouts/legal/legal-terms.component';
import {LegalPrivacyComponent} from './ui/layouts/legal/legal-privacy.component';
import {ExploreRudelComponent} from './ui/layouts/explore/explore-rudel.component';
import {ExploreExpeditionsComponent} from './ui/layouts/explore/explore-expeditions.component';
import {SettingsNotificationsComponent} from './ui/layouts/settings/settings-notifications.component';
import {Ng2DeviceDetectorModule} from "ng2-device-detector";
import {SettingsOtherComponent} from "./ui/layouts/settings/settings-other.component";
import {ExploreUserComponent} from "./ui/layouts/explore/explore-user.component";
import {ForgotPasswordComponent} from "./ui/layouts/authentication/forgot-password.component";
import {SignInComponent} from "./ui/layouts/authentication/sign-in.component";
import {SignUpComponent} from "./ui/layouts/authentication/sign-up.component";
import {SetPasswordComponent} from "./ui/layouts/authentication/set-password.component";
import {BrowserModule} from "@angular/platform-browser";
import {LandingContentComponent} from "./ui/layouts/landing/landing-content.component";

@NgModule({
	declarations: [
		AppComponent,
		SignInComponent,
		SignUpComponent,
		ForgotPasswordComponent,
		StyledButtonComponent,
		CarouselComponent,
		CarouselSlideComponent,
		DropdownMenuComponent,
		RudelDoneExpeditionsComponent,
		RudelItemComponent,
		ItemWrapperComponent,
		ListComponent,
		RudelComponent,
		StatisticsComponent,
		NotificationsComponent,
		ExpeditionsDoneComponent,
		ExpeditionsUpcomingComponent,
		SlotsComponent,
		ModalComponent,
		QuestionComponent,
		LogoComponent,
		NotificationItemComponent,
		ExpeditionItemComponent,
		LocationPickerComponent,
		MenuComponent,
		EmojiPickerComponent,
		MenuItemComponent,
		SettingsProfileComponent,
		EmojiComponent,
		ExpeditionComponent,
		LandingComponent,
		IndicatorComponent,
		EmptyComponent,
		LoadingComponent,
		DashboardComponent,
		RudelEditComponent,
		RudelCreateExpeditionComponent,
		RudelUpcomingExpeditionsComponent,
		RudelLikersComponent,
		RudelAddToListComponent,
		SettingsNotificationsComponent,
		LegalAboutComponent,
		LegalTermsComponent,
		LegalPrivacyComponent,
		UserAvatarComponent,
		ExpeditionCommentsComponent,
		ExpeditionAttendeesComponent,
		ExpeditionMapComponent,
		MapComponent,
		AddToListComponent,
		ExploreComponent,
		ExpeditionsComponent,
		StackComponent,
		SettingsOtherComponent,
		UserItemComponent,
		CommentItemComponent,
		RedirectComponent,
		ExpanderComponent,
		HighlightPipe,
		FormatPipe,
		RudelComponent,
		SettingsComponent,
		ListItemComponent,
		StackCardComponent,
		CreateRudelComponent,
		CreateListComponent,
		CheckboxComponent,
		SearchComponent,
		CoordinatesPipe,
		SearchBarComponent,
		NotFoundComponent,
		LegalComponent,
		FormControlWrapper,
		UserComponent,
		LandingContentComponent,
		ExploreExpeditionsComponent,
		ExploreRudelComponent,
		UserRudelComponent,
		UserLikeesComponent,
		KeysPipe,
		UserLikersComponent,
		UserListsComponent,
		BoardingComponent,
		FooterComponent,
		ListLikersComponent,
		ListRudelComponent,
		LocationSearchComponent,
		ExploreUserComponent,
		SafePipe,
		ArrayPipe,
		SetPasswordComponent,
		TranslationListComponent,
		DateTimeComponent
	],
	providers: [
		UserService,
		SearchService,
		RudelService,
		ListService,
		ScrollService,
		DataService,
		BoardingGuard,
		GeocodeService,
		UtilService,
		RudelResolver,
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
		InfiniteScrollModule,
		JsonpModule,
		Ng2DeviceDetectorModule.forRoot(),
		BrowserModule,
		routing
	],
	bootstrap: [
		AppComponent
	]
})
export class AppModule {
}
