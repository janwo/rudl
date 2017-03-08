import "rxjs/add/observable/throw";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/toPromise";
import "hammerjs";
// Web Font Loader.
import * as WebFont from "webfontloader";
WebFont.load({
	google: {
		families: [
			'Lato:400,700',
			'Fredoka+One'
		]
	}
});

// Normalize.css
require("../node_modules/normalize.css");

// Font Awesome
require("../node_modules/font-awesome/css/font-awesome.css");

// Leaflet
require("../node_modules/leaflet/dist/leaflet.css");
