import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './ui/layouts/dashboard/dashboard.component';
import {LoginGuard} from './guards/login';
import {ExploreComponent} from './ui/layouts/explore/explore.component';
import {ExpeditionsComponent} from './ui/layouts/expedition/expeditions.component';
import {SettingsComponent} from './ui/layouts/settings/settings.component';
import {ListComponent} from './ui/layouts/list/list.component';
import {SearchComponent} from './ui/layouts/search/search.component';
import {LegalComponent} from './ui/layouts/legal/legal.component';
import {BoardingComponent} from './ui/layouts/boarding/boarding.component';
import {BoardingGuard} from './guards/boarding';
import {UserComponent} from './ui/layouts/user/user.component';
import {UserListsComponent} from './ui/layouts/user/user-lists.component';
import {UserRudelComponent} from './ui/layouts/user/user-rudel.component';
import {UserLikeesComponent} from './ui/layouts/user/user-likees.component';
import {UserLikersComponent} from './ui/layouts/user/user-likers.component';
import {RudelComponent} from './ui/layouts/rudel/rudel.component';
import {LandingComponent} from './ui/layouts/landing/landing.component';
import {RudelResolver} from './resolver/rudel';
import {ListResolver} from './resolver/list';
import {UserResolver} from './resolver/user';
import {ExpeditionResolver} from './resolver/expedition';
import {ExpeditionComponent} from './ui/layouts/expedition/expedition.component';
import {RudelCreateExpeditionComponent} from './ui/layouts/rudel/rudel-create-expedition.component';
import {RudelLikersComponent} from './ui/layouts/rudel/rudel-likers.component';
import {RudelUpcomingExpeditionsComponent} from './ui/layouts/rudel/rudel-upcoming-expeditions.component';
import {RudelEditComponent} from './ui/layouts/rudel/rudel-edit.component';
import {RudelAddToListComponent} from './ui/layouts/rudel/rudel-add-to-list.component';
import {ListRudelComponent} from './ui/layouts/list/list-rudel.component';
import {ListLikersComponent} from './ui/layouts/list/list-likers.component';
import {NotFoundComponent} from './ui/layouts/404/404.component';
import {ExpeditionMapComponent} from './ui/layouts/expedition/expedition-map.component';
import {ExpeditionAttendeesComponent} from './ui/layouts/expedition/expedition-attendees.component';
import {ExpeditionCommentsComponent} from './ui/layouts/expedition/expedition-comments.component';
import {RudelDoneExpeditionsComponent} from './ui/layouts/rudel/rudel-done-expeditions.component';
import {SettingsProfileComponent} from './ui/layouts/settings/settings-profile.component';
import {NotificationsComponent} from './ui/layouts/notification/notifications.component';
import {ExpeditionsDoneComponent} from './ui/layouts/expedition/expeditions-done.component';
import {ExpeditionsUpcomingComponent} from './ui/layouts/expedition/expeditions-upcoming.component';
import {LegalAboutComponent} from './ui/layouts/legal/legal-about.component';
import {LegalTermsComponent} from './ui/layouts/legal/legal-terms.component';
import {LegalPrivacyComponent} from './ui/layouts/legal/legal-privacy.component';
import {ExploreExpeditionsComponent} from './ui/layouts/explore/explore-expeditions.component';
import {ExploreRudelComponent} from './ui/layouts/explore/explore-rudel.component';
import {SettingsNotificationsComponent} from './ui/layouts/settings/settings-notifications.component';
import {SettingsOtherComponent} from "./ui/layouts/settings/settings-other.component";
import {ExploreUserComponent} from "./ui/layouts/explore/explore-user.component";
import {ForgotPasswordComponent} from "./ui/layouts/authentication/forgot-password.component";
import {SignInComponent} from "./ui/layouts/authentication/sign-in.component";
import {SignUpComponent} from "./ui/layouts/authentication/sign-up.component";
import {SetPasswordComponent} from "./ui/layouts/authentication/set-password.component";

const appRoutes: Routes = [
    {
        path: 'membership-terminated', component: NotFoundComponent, data: {
        title: 'Konto entfernt',
        image: require('../assets/illustrations/user-not-found.png'),
        description: 'Wir haben dein Konto entfernt.'
    }
    },

	{
		path: 'legal',
		component: LegalComponent,
		children: [
			{path: '', redirectTo: 'about', pathMatch: 'full'},
			{path: 'about', component: LegalAboutComponent, pathMatch: 'full'},
			{path: 'terms', component: LegalTermsComponent},
			{path: 'privacy', component: LegalPrivacyComponent}
		]
	},

    {
        path: '',
        component: LandingComponent,
        children: [
            {path: '', redirectTo: 'sign-up', pathMatch: 'full'},
            {path: 'sign-up', component: SignUpComponent},
            {path: 'sign-in', component: SignInComponent},
            {path: 'forgot-password', component: ForgotPasswordComponent},
            {path: 'set-password', component: SetPasswordComponent}
        ]
    },

	{
		path: '',
		component: DashboardComponent,
		canActivate: [LoginGuard],
		children: [
			// Boarding required.
			{path: '', redirectTo: 'explore', pathMatch: 'full'},
			
			{path: 'explore', component: ExploreComponent, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'expeditions', pathMatch: 'full'},
				{path: 'rudel', component: ExploreRudelComponent},
				{path: 'user', component: ExploreUserComponent},
				{path: 'expeditions', component: ExploreExpeditionsComponent}
			]},
			
			{path: 'expeditions', component: ExpeditionsComponent, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'upcoming', pathMatch: 'full'},
				{path: 'done', component: ExpeditionsDoneComponent},
				{path: 'upcoming', component: ExpeditionsUpcomingComponent}
			]
			},
			
			{path: 'notifications', component: NotificationsComponent, pathMatch: 'full', canActivate: [BoardingGuard]},
			
			{
				path: 'user/not-found', component: NotFoundComponent, data: {
				title: 'Nutzer existiert nicht',
				image: require('../assets/illustrations/user-not-found.png'),
				description: 'Der angeforderte Nutzer existiert nicht.'
			}
			},
			
			{
				path: 'user/:username', resolve: {
				user: UserResolver
			}, component: UserComponent, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'rudel', pathMatch: 'full'},
				{path: 'rudel', component: UserRudelComponent},
				{path: 'lists', component: UserListsComponent},
				{path: 'likers', component: UserLikersComponent},
				{path: 'likees', component: UserLikeesComponent}
			]
			},
			
			{
				path: 'lists/not-found', component: NotFoundComponent, data: {
				title: 'Liste existiert nicht',
				image: require('../assets/illustrations/no-list-found.png'),
				description: 'Die angeforderte Liste existiert nicht.'
			}
			},
			{
				path: 'lists/deleted-message', component: NotFoundComponent, data: {
				title: 'Liste gelöscht',
				image: require('../assets/illustrations/no-list-found.png'),
				description: 'Die Liste wurde gelöscht, da es keine Anhänger mehr gab.'
			}
			},
			{
				path: 'lists/:list', component: ListComponent, resolve: {
				list: ListResolver
			}, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'rudel', pathMatch: 'full'},
				{path: 'rudel', component: ListRudelComponent},
				{path: 'likers', component: ListLikersComponent}
			]
			},
			
			{path: 'search', redirectTo: 'search/', pathMatch: 'full', canActivate: [BoardingGuard]},
			{path: 'search/:query', component: SearchComponent, canActivate: [BoardingGuard]},
			
			{
				path: 'rudel/not-found', component: NotFoundComponent, data: {
				title: 'Rudel existiert nicht',
				image: require('../assets/illustrations/rudel-not-found.png'),
				description: 'Das angeforderte Rudel existiert nicht.'
			}
			},
			{
				path: 'rudel/deleted-message', component: NotFoundComponent, data: {
				title: 'Rudel gelöscht',
				image: require('../assets/illustrations/rudel-not-found.png'),
				description: 'Das Rudel wurde gelöscht, da es keine Anhänger mehr gab.'
			}
			},
			{
				path: 'rudel/:rudel', component: RudelComponent, resolve: {
				rudel: RudelResolver
			}, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'upcoming-expeditions', pathMatch: 'full'},
				{path: 'upcoming-expeditions', component: RudelUpcomingExpeditionsComponent},
				{path: 'done-expeditions', component: RudelDoneExpeditionsComponent},
				{path: 'edit', component: RudelEditComponent},
				{path: 'add-to-list', component: RudelAddToListComponent},
				{path: 'likers', component: RudelLikersComponent},
				{path: 'create-expedition', component: RudelCreateExpeditionComponent}
			]
			},
			{
				path: 'expeditions/not-found', component: NotFoundComponent, data: {
				title: 'Streifzug existiert nicht',
				image: require('../assets/illustrations/expedition-not-found.png'),
				description: 'Der angeforderte Streifzug existiert nicht.'
			}
			},
			{
				path: 'expeditions/deleted-message', component: NotFoundComponent, data: {
				title: 'Streifzug abgesagt',
				image: require('../assets/illustrations/expedition-not-found.png'),
				description: 'Der Streifzug wurde abgesagt.'
			}
			},
			{
				path: 'expeditions/:expedition', component: ExpeditionComponent, resolve: {
				expedition: ExpeditionResolver
			}, canActivate: [BoardingGuard], children: [
				{path: '', redirectTo: 'map', pathMatch: 'full'},
				{path: 'attendees', component: ExpeditionAttendeesComponent},
				{path: 'discussion', component: ExpeditionCommentsComponent},
				{path: 'map', component: ExpeditionMapComponent}
			]
			},
			
			// No boarding required.
			{path: 'boarding', component: BoardingComponent},
			
			{path: 'settings', component: SettingsComponent, children: [
				{path: '', redirectTo: 'profile', pathMatch: 'full'},
				{path: 'profile', component: SettingsProfileComponent},
				{path: 'other', component: SettingsOtherComponent},
				{path: 'notifications', component: SettingsNotificationsComponent}
			]
			},
			{
				path: '404', component: NotFoundComponent, data: {
				title: 'Oops, hier ist nichts!',
				image: require('../assets/illustrations/not-found.png'),
				description: 'Die angeforderte Seite existiert nicht.'
			}
			},
			{path: '**', redirectTo: '404'}
		]
	},

	{
		path: '404',
        component: NotFoundComponent,
            data: {
            title: 'Oops, hier ist nichts!', //Oops, nothing here!
            image: require('../assets/illustrations/not-found.png'),
            description: 'Die angeforderte Seite existiert nicht.'//The requested page does not exist!
        }
	},

	{
	    path: '**',
        redirectTo: '404'
	}
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
