import {AccountController} from '../controllers/AccountController';
import {DatabaseManager} from '../Database';
import {User} from '../models/user/User';
import {MailManager} from '../Mail';
import Integer from 'neo4j-driver/lib/v1/integer';

export const ScheduleConfig = {
	rule: {
		second: 0,
		minute: 15,
		hour: 4
	},
	job: () => {
		// Create notifications.
		let session = DatabaseManager.neo4jClient.session();
		return session.run(`MATCH (e:Expedition)<-[:JOINS_EXPEDITION]-(u:User) WHERE e.date > $now AND e.date < $now + 86400 WITH properties(e) as e, COLLECT(properties(u)) as u RETURN {expedition: e, users: u}`, {
			now: Math.trunc(Date.now() / 1000)
		}).then((results: any) => {
			let mailJobs = results.records.map((record: any)  => {
				let user: User = DatabaseManager.neo4jFunctions.unflatten(record, 'u');
				return MailManager.sendNotificationMail({
					name: user.firstName,
					to: user.mails.primary.mail,
					locale: user.languages.shift(),
					unread: Integer.toNumber(record.get('unread') as any as Integer)
				});
			});
			
			return Promise.all(mailJobs).then((() => {
				console.log(`Queued ${mailJobs.length} notification mails successfully.`);
				session.close();
			}));
		});
	}
};
