import 'zone.js/dist/zone';
import 'reflect-metadata';

if (process.env.ENV == 'development' || process.env.ENV == 'test') {
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}
