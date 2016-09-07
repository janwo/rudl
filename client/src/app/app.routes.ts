import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {LandingPageComponent} from "./ui/landing-page.component";
import {DashboardComponent} from "./ui/dashboard.component";
import {AppGuard} from "./app.guard";
import {AuthCallbackComponent} from "./ui/auth-callback.component";

const appRoutes: Routes = [
    {path: '', component: LandingPageComponent},
    {path: 'home', component: DashboardComponent, canActivate: [AppGuard]},
    {path: 'oauth/:strategy', component: AuthCallbackComponent}
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
