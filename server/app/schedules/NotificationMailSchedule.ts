import {AccountController} from '../controllers/AccountController';
import {DatabaseManager} from '../Database';
import {User} from '../models/user/User';
import {MailManager} from '../Mail';
import Integer from 'neo4j-driver/lib/v1/integer';

export const ScheduleConfig = {
	rule: {
		second: 0,
		minute: 0,
		hour: 8
	},
	job: () => {
		// Send notification mails.
		let session = DatabaseManager.neo4jClient.session();
		return session.run(`MATCH(ns:NotificationSettings)<-[:NOTIFICATION_SETTINGS]-(u:User)-[:NOTIFICATION_UNREAD]->(n:Notification) WHERE ns.emailNotifications AND n.createdAt > ns.lastEmailNotification SET ns.lastEmailNotification = $now WITH u MATCH (u)-[:NOTIFICATION_UNREAD]->(n:Notification) RETURN count(n) as unread, properties(u) as u`, {
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
