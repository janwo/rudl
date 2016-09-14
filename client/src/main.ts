import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./app/app.module";
import * as WebFont from "webfontloader";
import './app/rxjs-operators';

// Initialize Angular.
platformBrowserDynamic().bootstrapModule(AppModule);

// Load Fonts.
WebFont.load({
	google: {
		families: [
			'Lato:400,700',
		    'Fredoka+One'
		]
	}
});
