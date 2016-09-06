Error.stackTraceLimit = Infinity;

require( 'core-js/es6' );
require( 'reflect-metadata' );

require( 'zone.js/dist/zone' );
require( 'zone.js/dist/long-stack-trace-zone' );
require( 'zone.js/dist/jasmine-patch' );
require( 'zone.js/dist/async-test' );
require( 'zone.js/dist/fake-async-test' );

let appContext = require.context( '../src', true, /\.spec\.ts/ );

appContext.keys().forEach( appContext );

let testing = require( '@angular/core/testing' );
let browser = require( '@angular/platform-browser-dynamic/testing' );

testing.setBaseTestProviders( browser.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, browser.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS );
