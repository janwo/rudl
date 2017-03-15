import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {DashboardComponent} from "./ui/layouts/dashboard/dashboard.component";
import {LoginGuard} from "./guards/login";
import {ExploreComponent} from "./ui/layouts/explore/explore.component";
import {PeopleComponent} from "./ui/layouts/people/people.component";
import {SettingsComponent} from "./ui/layouts/settings/settings.component";
import {ListComponent} from "./ui/layouts/list/list.component";
import {SearchComponent} from "./ui/layouts/search/search.component";
import {LegalComponent} from "./ui/layouts/legal/legal.component";
import {EventComponent} from "./ui/layouts/event/event.component";
import {BoardingComponent} from "./ui/layouts/boarding/boarding.component";
import {BoardingGuard} from "./guards/boarding";
import {UserComponent} from "./ui/layouts/user/user.component";
import {UserListsComponent} from "./ui/layouts/user/user-lists.component";
import {UserActivitiesComponent} from "./ui/layouts/user/user-activities.component";
import {UserFolloweesComponent} from "./ui/layouts/user/user-followees.component";
import {UserFollowersComponent} from "./ui/layouts/user/user-followers.component";
import {ActivityComponent} from "./ui/layouts/activity/activity.component";
import {ActivityPastEventsComponent} from "./ui/layouts/activity/activity-past-events.component";
import {ActivityNearbyEventsComponent} from "./ui/layouts/activity/activity-nearby-events.component";
import {ActivityUserEventsComponent} from "./ui/layouts/activity/activity-user-events.component";
import {LandingComponent} from "./ui/layouts/landing/landing.component";

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
           
            { path: 'people/:username', component: UserComponent, canActivate: [BoardingGuard ], children: [
	            { path: '', redirectTo: 'rudel', pathMatch: 'full' },
	            { path: 'rudel', component: UserActivitiesComponent },
	            { path: 'lists', component: UserListsComponent },
	            { path: 'followers', component: UserFollowersComponent },
	            { path: 'followees', component: UserFolloweesComponent },
            ] },
           
            { path: 'lists/:list', component: ListComponent, canActivate: [ BoardingGuard ] },
           
            { path: 'search', redirectTo: 'search/', pathMatch: 'full', canActivate: [ BoardingGuard ] },
            { path: 'search/:query', component: SearchComponent, canActivate: [ BoardingGuard ] },
          
	        { path: 'rudel/:activity', component: ActivityComponent, canActivate: [ BoardingGuard ], children: [
                { path: '', redirectTo: 'nearby-events', pathMatch: 'full' },
                { path: 'past-events', component: ActivityPastEventsComponent },
                { path: 'nearby-events', component: ActivityNearbyEventsComponent },
                { path: 'your-events', component: ActivityUserEventsComponent }
            ] },
          
            { path: 'events/:event', component: EventComponent, canActivate: [ BoardingGuard ] },
	        
	        // No boarding required.
	        { path: 'boarding', component: BoardingComponent },
	        { path: 'settings', component: SettingsComponent }
        ]
    },
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
