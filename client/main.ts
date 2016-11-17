import { enableProdMode } from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

let ENV: any = process.env.ENV || 'development';
if (ENV === 'secure') enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);
