import * as Glob from 'glob';
import * as Path from 'path';
import * as schedule from 'node-schedule';
import {JobCallback, RecurrenceRule} from 'node-schedule';

export class ScheduleManager {
	
	public static start(): void {
		Glob.sync(Path.resolve(__dirname, `./schedules/**/*.ts`)).forEach(file => {
			let config: ScheduleConfiguration = require(file).ScheduleConfig;
			console.log(`Schedules job in ${Path.basename(file)}...`);
			schedule.scheduleJob(config.rule, config.job);
		});
	}
}

export interface ScheduleConfiguration {
	rule: RecurrenceRule,
	job: JobCallback
}
