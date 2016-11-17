import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./app/app.module";
import * as WebFont from "webfontloader";
import { enableProdMode } from '@angular/core';
import './app/rxjs-operators';

let ENV: any = process.env.ENV || 'development';
if (ENV === 'secure') enableProdMode();

// Load Fonts.
WebFont.load({
	google: {
		families: [
			'Lato:400,700',
			'Fredoka+One'
		]
	}
});

// Initialize Angular.
platformBrowserDynamic().bootstrapModule(AppModule);
