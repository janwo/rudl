import * as nodemailer from 'nodemailer';
import * as ses from 'nodemailer-ses-transport';
import {SentMessageInfo, Transporter} from 'nodemailer';
import {Config} from '../../run/config';
import * as Bull from 'bull';
import * as Path from 'path';
import {Locale} from './models/Translations';
import * as Handlebars from "handlebars";
import * as EmailTemplate from "email-templates";

Handlebars.registerHelper('pluralize', (number: number, single: string, plural: string) => {
	if (number === 1) return single;
	return plural;
});

export class MailManager {
	
	static instance: MailManager;
	private transporter: Transporter;
	private queue: Bull.Queue;
	
	constructor() {
		this.transporter = nodemailer.createTransport(ses({
			accessKeyId: Config.backend.ses.accessKeyId,
			secretAccessKey: Config.backend.ses.secretAccessKey,
			rateLimit: Config.backend.ses.rateLimit,
			region: Config.backend.ses.region
		}));
		
		this.queue = new Bull('mail', {
			redis: {
				port: Config.backend.db.redis.port,
				host: Config.backend.db.redis.host
			}
		});
		
		this.queue.process(job => {
			// Send Mail.
			return new Promise((resolve, reject) => {
				MailManager.instance.transporter.sendMail({
					from: Config.backend.ses.from,
					to: job.data.to,
					subject: job.data.subject,
					html: job.data.html,
					text: job.data.text
				}, (error: Error, info: SentMessageInfo) => {
					if (error) reject(error);
					else resolve(info);
				});
			});
		});
	}
	
	static sendMail(options: MailOptions): Promise<void> {
		if (!MailManager.instance) MailManager.instance = new MailManager();
		return MailManager.instance.queue.add(options).then(() => {});
	}
	
	static sendWelcomeMail(options: WelcomeMailOptions): Promise<void> {
		let dir = Path.resolve(__dirname, './templates/mail/welcome');
		let template = new EmailTemplate.EmailTemplate(dir);
		
		return (template.render({
			name: options.name,
			notificationSettingsLink: 'https://rudl.me/settings/notifications',
			address: [
				'rudl // Jan Wolf',
				'Kleine Helle 41',
				'28195 Bremen'
			]
		}, options.locale as any) as any as Promise<any>).then((results: EmailTemplateResults) => {
			return MailManager.sendMail({
				to: options.to,
				subject: results.subject,
				text: results.text,
				html: results.html
			});
		});
	}
	
	
	static sendNotificationMail(options: NotificationMailOptions): Promise<void> {
		let dir = Path.resolve(__dirname, './templates/mail/notification');
		let template = new EmailTemplate.EmailTemplate(dir);
		
		return (template.render({
			name: options.name,
			unread: options.unread,
			notificationsLink: 'https://rudl.me/notifications',
			notificationSettingsLink: 'https://rudl.me/settings/notifications',
			address: [
				'rudl // Jan Wolf',
				'Kleine Helle 41',
				'28195 Bremen'
			]
		}, options.locale as any) as any as Promise<any>).then((results: EmailTemplateResults) => {
			return MailManager.sendMail({
				to: options.to,
				subject: results.subject,
				text: results.text,
				html: results.html
			});
		});
	}
}

export interface WelcomeMailOptions {
	to: string;
	name: string;
	locale: Locale;
}

export interface NotificationMailOptions {
	to: string;
	name: string;
	locale: Locale;
	unread: number;
}

export interface MailOptions {
	to: string;
	subject: string,
	text: string,
	html: string
}

