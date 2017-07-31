import {AccountController} from '../controllers/AccountController';
import {DatabaseManager} from '../Database';
import {User} from '../models/user/User';
import {MailManager} from '../Mail';

export const ScheduleConfig = {
	rule: {
		second: 0,
		minute: 0,
		hour: 8
	},
	job: () => {
		// Send notification mails.
		let session = DatabaseManager.neo4jClient.session();
		return session.run(`MATCH(ns:Settings)<-[:USER_SETTINGS]-(u:User)-[:NOTIFICATION_UNREAD]->(n:Notification) WHERE ns.notificationMails AND (ns.lastNotificationMail IS NULL OR n.createdAt > ns.lastNotificationMail) SET ns.lastNotificationMail = $now RETURN {unread: count(n), user: properties(u)} as result`, {
			now: Math.trunc(Date.now() / 1000)
		}).then((result: any) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'result')).then((results: {
            unread: number,
            user: User
        }[]) => {
		    let mailJobs = results.map(result => MailManager.sendNotificationMail({
                name: result.user.firstName,
                to: result.user.mail,
                locale: result.user.languages.shift(),
                unread: result.unread
            }));
			
			return Promise.all(mailJobs).then((() => {
				console.log(`Queued ${mailJobs.length} notification mails successfully.`);
				session.close();
			}));
		});
	}
};
