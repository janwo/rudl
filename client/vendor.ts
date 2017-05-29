import "rxjs/add/observable/throw";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/toPromise";
import "hammerjs";
import * as WebFont from "webfontloader";

// CSS dependencies.
require("../node_modules/normalize.css");
require("../node_modules/material-design-icons/iconfont/material-icons.css");
require("../node_modules/leaflet/dist/leaflet.css");

// Initialization of selected dependencies.
WebFont.load({
	google: {
		families: [
			'Lato:300,400,700',
			'Quicksand:700'
		]
	}
});

