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
import {ProfileComponent, RedirectProfileComponent} from "./ui/profile.component";
import {MeComponent} from "./ui/me.component";

const appRoutes: Routes = [
    {
        path: 'sign_up',
        component: LandingPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'oauth/:strategy',
        component: AuthCallbackComponent,
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
            { path: 'people', component: PeopleComponent, pathMatch: 'full' },
            { path: 'people/:username', component: RedirectProfileComponent , pathMatch: 'full' },
            { path: 'people/:username/:tab', component: ProfileComponent },
            { path: 'me', component: MeComponent },
            { path: 'settings', redirectTo: 'settings/account', pathMatch: 'full' },
            { path: 'settings/:page', component: SettingsComponent }
        ]
    },
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
