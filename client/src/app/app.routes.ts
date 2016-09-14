import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {AppGuard} from "./app.guard";
import {AuthCallbackComponent} from "./ui/auth-callback.component";
import {ExploreComponent} from "./ui/explore.component";
import {ActivityComponent} from "./ui/activity.component";
import {PeopleComponent} from "./ui/people.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent} from "./ui/profile.component";

const appRoutes: Routes = [
    {
        path: 'sign-up',
        component: LandingPageComponent,
        pathMatch: 'full'
    },
    {
        path: '',
        component: DashboardComponent,
        canActivate: [AppGuard],
        children: [
            { path: '', redirectTo: 'explore', pathMatch: 'full' },
            { path: 'activity', component: ActivityComponent },
            { path: 'explore', component: ExploreComponent },
            { path: 'people', component: PeopleComponent },
            { path: 'settings', component: SettingsComponent },
            { path: 'profile', component: ProfileComponent }
        ]
    },
    {
        path: 'oauth/:strategy',
        component: AuthCallbackComponent,
        pathMatch: 'full'
    }
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
