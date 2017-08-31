import {AccountController} from '../controllers/AccountController';
import {DatabaseManager} from '../Database';
import {User} from '../models/user/User';
import {MailManager, NewsletterMailOptions} from '../Mail';
import {Newsletter} from "../models/newsletter/Newsletter";
import {getBestLanguage, Locale} from "../models/Translations";

export const ScheduleConfig = {
	rule: {
		second: 0
	},
	job: () => {
		// Send notification mails.
		let session = DatabaseManager.neo4jClient.session();
		return session.run(`MATCH(n:Newsletter {ready: true, sent: false}) SET n.sent = true WITH COLLECT(properties(n)) as newsletters MATCH(ns:Settings {newsletterMails: true})<-[:USER_SETTINGS]-(u:User) WHERE u.username = 'maziar' OR u.username = 'jntaylor' WITH COLLECT(properties(u)) as users, newsletters RETURN {users: users, newsletters: newsletters} as result`).then((result: any) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'result')).then((result: {
			users: User[],
			newsletters: Newsletter[]
        }) => {
		    console.log(result);
		    let mailJobs: NewsletterMailOptions[] = [];
            result.users.forEach(user => {
                result.newsletters.forEach(newsletter => {
                    let locales = Object.keys(newsletter.mail) as Locale[];
                    let locale: Locale = getBestLanguage(locales, user.languages);
                    if(!locale) locale = locales[0];
                    mailJobs.push({
                        name: user.firstName,
                        to: user.mail,
                        subject: newsletter.mail[locale].subject,
                        text: newsletter.mail[locale].text,
                        locale: locale
                    });
                });
            });
			
			return Promise.all(mailJobs.map(job => MailManager.sendNewsletterMails(job))).then((() => {
				console.log(`Queued ${mailJobs.length} newsletter mails successfully.`);
				session.close();
			}));
		});
	}
};
