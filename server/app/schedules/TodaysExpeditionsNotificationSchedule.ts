import {AccountController} from '../controllers/AccountController';
import {DatabaseManager} from '../Database';
import {User} from '../models/user/User';
import {MailManager} from '../Mail';
import {Expedition} from "../models/expedition/Expedition";
import {StatementResult} from "neo4j-driver/types/v1/result";
import {NotificationType} from "../models/notification/Notification";

export const ScheduleConfig = {
    rule: {
        second: 0,
        minute: 30,
        hour: 7
    },
    job: () => {
        // Send notification mails.
        let session = DatabaseManager.neo4jClient.session();
        let transaction = session.beginTransaction();
        return transaction.run(`MATCH (e:Expedition)<-[:JOINS_EXPEDITION]-(u:User) WHERE e.date > $now AND e.date < $now + 86400*10 WITH properties(e) as e, COLLECT(properties(u)) as u RETURN {expedition: e, users: u} as result`, {
            now: Math.trunc(Date.now() / 1000)
        }).then((result: any) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'result')).then((results: {
            expedition: Expedition,
            users: User[]
        }[]) => {
            let jobs = results.map(result => AccountController.NotificationController.set(transaction, NotificationType.EXPEDITION_IS_TODAY, result.users, result.expedition));
            return Promise.all(jobs);
        }).then(() => transaction.commit()).then(() => session.close());
    }
};
