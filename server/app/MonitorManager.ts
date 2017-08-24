import * as client from 'prom-client';
import {Monitor} from "forever-monitor";
import {Server} from "hapi";
import * as http from 'http';
import {Config} from "../../run/config";

export class MonitorManager {

    private static internalMetrics = {
        duration: new client.Summary({
            name: 'http_request_duration_seconds',
            help: 'The HTTP request latencies in seconds.',
            labelNames: ['route'],
            percentiles: [0.5, 0.9, 0.99]
        }),
        total: new client.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests made.',
            labelNames: ['code', 'method', 'route']
        })
    };

    static metrics: {[key: string]: client.Counter | client.Summary | client.Histogram | client.Gauge } = {};

    private static diff(start) {
        return Date.now() - start;
    }

    private static observe(start: number, route: string, code: string, method: string ) {
        MonitorManager.internalMetrics.duration.labels(route).observe(MonitorManager.diff(start) / 1000);
        MonitorManager.internalMetrics.total.labels(code, method, route).inc(1);
    }

    static register(server: Server) {
        server.ext('onRequest', (request: any, reply: any) => {
            request.firedAt = Date.now();
            return reply.continue();
        });

        server.on('response', (request: any) => MonitorManager.observe(request.firedAt, request.route.path,request.response ? request.response.statusCode : 0, request.method.toLowerCase()));

        http.createServer((request: any, reply: any) => {
            reply.writeHead(200, 'OK', {'content-type': 'text/plain'});
            reply.end(client.register.metrics());
        }).listen(Config.backend.ports.prometheusSummary, Config.backend.host);
    }
}
