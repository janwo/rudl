// RxJS
// import 'rxjs/Rx'; // adds ALL RxJS statics & operators to Observable

// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';

// Web Font Loader.
import * as WebFont from "webfontloader";
// <-- Pending Bug, see http://stackoverflow.com/questions/38995709/webpacks-commonschunkplugin-and-the-use-of-import-as
WebFont.load({
	google: {
		families: [
			'Lato:400,700',
			'Fredoka+One'
		]
	}
});

// Font Awesome.
import "../node_modules/font-awesome/scss/font-awesome.scss";

// Normalize.css.
import "../node_modules/normalize.css/normalize.css";
