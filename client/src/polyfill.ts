import "core-js/es6";
import "reflect-metadata";

require('zone.js/dist/zone');

let ENV: any = process.env.ENV || 'development';

if (ENV === 'production') {
	// Production
	
} else {
	// Development
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}
