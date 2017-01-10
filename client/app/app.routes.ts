import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {AppGuard} from "./app.guard";
import {AuthCallbackComponent} from "./ui/auth-callback.component";
import {ExploreComponent} from "./ui/explore.component";
import {HistoryComponent} from "./ui/history.component";
import {PeopleComponent} from "./ui/people.component";
import {SettingsComponent} from "./ui/settings.component";
import {ProfileComponent} from "./ui/profile.component";
import {RedirectComponent} from "./redirect.component";
import {ListComponent} from "./ui/list.component";
import {ActivityComponent} from "./ui/activity.component";

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
            { path: 'history', component: HistoryComponent },
            { path: 'explore', component: ExploreComponent },
            { path: 'people', component: PeopleComponent, pathMatch: 'full' },
            { path: 'people/:username', component: RedirectComponent , data: { redirect: ['./activity'] }, pathMatch: 'full' },
            { path: 'people/:username/:tab', component: ProfileComponent },
            { path: 'lists/:key', component: ListComponent },
            { path: 'activities/:key', component: ActivityComponent },
            { path: 'settings', redirectTo: 'settings/account', pathMatch: 'full' },
            { path: 'settings/:page', component: SettingsComponent }
        ]
    },
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
