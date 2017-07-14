import * as Glob from 'glob';
import * as Path from 'path';
import * as schedule from 'node-schedule';
import {JobCallback, RecurrenceRule} from 'node-schedule';

export class Schedule {
	
	public static start(): void {
		Glob.sync(Path.resolve(__dirname, `./schedules/**/*.ts`)).forEach(file => {
			let config: ScheduleConfiguration = require(file).ScheduleConfig;
			schedule.scheduleJob(config.rule, config.job);
		});
	}
}

export interface ScheduleConfiguration {
	rule: RecurrenceRule,
	job: JobCallback
}
