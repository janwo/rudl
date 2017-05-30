import 'zone.js/dist/zone';
import 'reflect-metadata';
// https://github.com/angular/angular-cli/blob/b15d1f37b6c6d7e57d969359b8b7d8a916465362/packages/%40angular/cli/blueprints/ng/files/__path__/polyfills.ts

if (process.env.ENV == 'development' || process.env.ENV == 'test') {
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}
