import "zone.js/dist/zone";
import "reflect-metadata";

let ENV: any = process.env.ENV || 'development';

if (ENV !== 'production' && ENV !== 'secure') {
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}
