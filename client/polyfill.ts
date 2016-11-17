import "core-js/es6";
import "reflect-metadata";
import 'zone.js/dist/zone';

let ENV: any = process.env.ENV || 'development';

if (ENV !== 'production') {
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}
