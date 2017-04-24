import {ModuleWithProviders} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {DashboardComponent} from "./ui/layouts/dashboard/dashboard.component";
import {LoginGuard} from "./guards/login";
import {ExploreComponent} from "./ui/layouts/explore/explore.component";
import {PeopleComponent} from "./ui/layouts/people/people.component";
import {SettingsComponent} from "./ui/layouts/settings/settings.component";
import {ListComponent} from "./ui/layouts/list/list.component";
import {SearchComponent} from "./ui/layouts/search/search.component";
import {LegalComponent} from "./ui/layouts/legal/legal.component";
import {BoardingComponent} from "./ui/layouts/boarding/boarding.component";
import {BoardingGuard} from "./guards/boarding";
import {UserComponent} from "./ui/layouts/user/user.component";
import {UserListsComponent} from "./ui/layouts/user/user-lists.component";
import {UserActivitiesComponent} from "./ui/layouts/user/user-activities.component";
import {UserFolloweesComponent} from "./ui/layouts/user/user-followees.component";
import {UserFollowersComponent} from "./ui/layouts/user/user-followers.component";
import {ActivityComponent} from "./ui/layouts/activity/activity.component";
import {LandingComponent} from "./ui/layouts/landing/landing.component";
import {ActivityResolver} from "./resolver/activity";
import {ListResolver} from "./resolver/list";
import {UserResolver} from "./resolver/user";
import {ExpeditionResolver} from "./resolver/expedition";
import {ExpeditionComponent} from "./ui/layouts/expedition/expedition.component";
import {ActivityCreateExpeditionComponent} from "./ui/layouts/activity/activity-create-expedition.component";
import {ActivityFollowersComponent} from "./ui/layouts/activity/activity-followers.component";
import {ActivityExpeditionsComponent} from "./ui/layouts/activity/activity-expeditions.component";
import {ActivityEditComponent} from "./ui/layouts/activity/activity-edit.component";
import {ActivityAddToListComponent} from "./ui/layouts/activity/activity-add-to-list.component";
import {ListActivitiesComponent} from "./ui/layouts/list/list-activities.component";
import {ListFollowersComponent} from "./ui/layouts/list/list-followers.component";
import {NotFoundComponent} from "./ui/layouts/404/404.component";

const appRoutes: Routes = [
    {
        path: 'sign_up',
        component: LandingComponent,
        pathMatch: 'full'
    },
    {
        path: 'sign_upp',
        component: LandingComponent,
        pathMatch: 'full',
        data: {
            login: true
        }
    },
    {
        path: 'legal',
        component: LegalComponent
    },
    {
        path: '',
        component: DashboardComponent,
        canActivate: [ LoginGuard ],
        children: [
	        // Boarding required.
            { path: '', redirectTo: 'explore', pathMatch: 'full' },
            { path: 'explore', component: ExploreComponent, canActivate: [ BoardingGuard ]},
	        
	        { path: 'people', component: PeopleComponent, pathMatch: 'full', canActivate: [ BoardingGuard ] },
	
	        { path: 'people/not-found', component: NotFoundComponent, data: {
		        title: 'Invalid username!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'The requested user does not exist!'
	        }},
	        { path: 'people/deleted-message', component: NotFoundComponent, data: {
		        title: 'We deleted your account!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'Hope you come back soon <3.'
	        }},
            { path: 'people/:username', resolve: {
	            user: UserResolver
            }, component: UserComponent, canActivate: [BoardingGuard ], children: [
	            { path: '', redirectTo: 'rudel', pathMatch: 'full' },
	            { path: 'rudel', component: UserActivitiesComponent },
	            { path: 'lists', component: UserListsComponent },
	            { path: 'followers', component: UserFollowersComponent },
	            { path: 'followees', component: UserFolloweesComponent },
            ] },
	
	        { path: 'lists/not-found', component: NotFoundComponent, data: {
		        title: 'Invalid list id!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'The requested list does not exist!'
	        }},
	        { path: 'lists/deleted-message', component: NotFoundComponent, data: {
		        title: 'List deleted!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'We deleted the list as no followers remained.'
	        }},
            { path: 'lists/:list', component: ListComponent, resolve: {
	            list: ListResolver
            }, canActivate: [ BoardingGuard ], children: [
	            { path: '', redirectTo: 'rudel', pathMatch: 'full' },
	            { path: 'rudel', component: ListActivitiesComponent },
	            { path: 'followers', component: ListFollowersComponent }
            ] },
           
            { path: 'search', redirectTo: 'search/', pathMatch: 'full', canActivate: [ BoardingGuard ] },
            { path: 'search/:query', component: SearchComponent, canActivate: [ BoardingGuard ] },
	
	        { path: 'rudel/not-found', component: NotFoundComponent, data: {
		        title: 'Invalid rudel id!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'The requested rudel does not exist!'
	        }},
	        { path: 'rudel/deleted-message', component: NotFoundComponent, data: {
		        title: 'Rudel deleted!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'We deleted the rudel as no followers remained.'
	        }},
	        { path: 'rudel/:activity', component: ActivityComponent, resolve: {
		        activity: ActivityResolver
	        }, canActivate: [ BoardingGuard ], children: [
				{ path: '', redirectTo: 'expeditions', pathMatch: 'full' },
				{ path: 'expeditions', component: ActivityExpeditionsComponent },
		        { path: 'edit', component: ActivityEditComponent },
		        { path: 'add-to-list', component: ActivityAddToListComponent },
				{ path: 'followers', component: ActivityFollowersComponent },
				{ path: 'create-expedition', component: ActivityCreateExpeditionComponent },
			] },
	        { path: 'expeditions/not-found', component: NotFoundComponent, data: {
		        title: 'Invalid expedition id!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'The requested expedition does not exist!'
	        }},
	        { path: 'expeditions/deleted-message', component: NotFoundComponent, data: {
		        title: 'Expedition deleted!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'We deleted the expedition as no followers remained.'
	        }},
	        { path: 'expeditions/:expedition', component: ExpeditionComponent, resolve: {
		        expedition: ExpeditionResolver
	        }, canActivate: [ BoardingGuard ] },
	        
	        // No boarding required.
	        { path: 'boarding', component: BoardingComponent },
	        { path: 'settings', component: SettingsComponent },
	        { path: '404', component: NotFoundComponent, data: {
		        title: 'Oops, nothing here!',
		        image: require('../assets/boarding/radar.png'),
		        description: 'The requested page does not exist!'
	        }},
	        { path: '**', redirectTo: '404' }
        ]
    },
	{ path: '404', component: NotFoundComponent, data: {
		title: 'Oops, nothing here!',
		image: require('../assets/boarding/radar.png'),
		description: 'The requested page does not exist!'
	}},
	{ path: '**', redirectTo: '404' }
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
