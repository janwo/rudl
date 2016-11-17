import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./app/app.module";
import * as WebFont from "webfontloader";
import { enableProdMode, TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';
import { TRANSLATION } from './app/locale/messages.de-DE';
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
platformBrowserDynamic().bootstrapModule(AppModule, {
	providers: [
	{provide: TRANSLATIONS, useValue: TRANSLATION},
	{provide:TRANSLATIONS_FORMAT, useValue:'xlf'},
	{provide:LOCALE_ID, useValue:'fr'}
]});
