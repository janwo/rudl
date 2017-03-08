import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {LoginGuard} from "./guards/login";
import {ExploreComponent} from "./ui/explore.component";
import {PeopleComponent} from "./ui/people.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent} from "./ui/profile.component";
import {RedirectComponent} from "./redirect.component";
import {ListComponent} from "./ui/list.component";
import {ActivityComponent} from "./ui/activity.component";
import {SearchComponent} from "./ui/search.component";
import {LegalComponent} from "./ui/legal.component";
import {EventComponent} from "./ui/event.component";
import {BoardingComponent} from "./ui/boarding.component";
import {BoardingGuard} from "./guards/boarding";

const appRoutes: Routes = [
    {
        path: 'sign_up',
        component: LandingPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'sign_upp',
        component: LandingPageComponent,
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
           
            { path: 'people/:username', component: RedirectComponent , data: { redirect: ['./activities'] }, pathMatch: 'full' },
            { path: 'people/:username/:tab', component: ProfileComponent, canActivate: [ BoardingGuard ] },
           
            { path: 'lists/:key', component: ListComponent, canActivate: [ BoardingGuard ] },
           
            { path: 'search', redirectTo: 'search/', pathMatch: 'full', canActivate: [ BoardingGuard ] },
            { path: 'search/:query', component: SearchComponent, canActivate: [ BoardingGuard ] },
          
            { path: 'activities/:key', component: ActivityComponent, canActivate: [ BoardingGuard ] },
          
            { path: 'events/:key', component: EventComponent, canActivate: [ BoardingGuard ] },
	        
	        // No boarding required.
	        { path: 'boarding', component: BoardingComponent },
	        { path: 'settings', redirectTo: 'settings/account', pathMatch: 'full' },
	        { path: 'settings/:page', component: SettingsComponent }
        ]
    },
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
