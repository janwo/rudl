import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';
import {SendMailOptions, SentMessageInfo, Transporter} from 'nodemailer';
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

Handlebars.registerHelper('breaklines', (text: string) => {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
});

const address = [
    'rudl // Jan Wolf',
    'Kleine Helle 41',
    '28195 Bremen'
];

export class MailManager {
	
	static instance: MailManager;
	private transporter: Transporter;
	private queue: Bull.Queue;
	
	constructor() {
		this.transporter = nodemailer.createTransport({
            SES: new aws.SES({
                accessKeyId: Config.backend.ses.accessKeyId,
                secretAccessKey: Config.backend.ses.secretAccessKey,
                region: Config.backend.ses.region
            }),
            sendingRate: Config.backend.ses.sendingRate
        });
		
		this.queue = new Bull('mail', {
			redis: {
				port: Config.backend.db.redis.port,
				host: Config.backend.db.redis.host
			}
		});
		
		this.queue.process(job => {
			// Send Mail.
			return new Promise((resolve, reject) => {
			    let mailOptions: SendMailOptions = {
                    from: Config.backend.ses.from.broadcast,
                    to: job.data.to,
                    subject: job.data.subject,
                    html: job.data.html,
                    text: job.data.text
                };

			    if(job.data.answerable) {
			        mailOptions.from = Config.backend.ses.from.answerable;
                    mailOptions.replyTo = Config.backend.ses.from.answerable;
                }

				if(Config.backend.ses.operational) {
                    MailManager.instance.transporter.sendMail(mailOptions, (error: Error, info: SentMessageInfo) => {
                        if (error) reject(error);
                        else resolve(info);
                    });
					return;
				}
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
		
		return template.render({
			name: options.name,
			provider: options.provider,
			notificationSettingsLink: 'https://rudl.me/settings/notifications',
			address: address
		}, options.locale as any).then((results: EmailTemplateResults) => {
			return MailManager.sendMail({
				to: options.to,
				subject: results.subject,
				text: results.text,
				html: results.html,
                answerable: false
			});
		});
	}

    static sendResetPasswordMail(options: ResetPasswordMailOptions): Promise<void> {
        let dir = Path.resolve(__dirname, './templates/mail/reset-password');
        let template = new EmailTemplate.EmailTemplate(dir);

        return template.render({
            name: options.name,
            resetPasswordLink: options.resetPasswordLink,
            notificationSettingsLink: 'https://rudl.me/settings/notifications',
            address: address
        }, options.locale).then((results: EmailTemplateResults) => {
            return MailManager.sendMail({
                to: options.to,
                subject: results.subject,
                text: results.text,
                html: results.html,
                answerable: false
            });
        });
    }


    static sendNotificationMail(options: NotificationMailOptions): Promise<void> {
        let dir = Path.resolve(__dirname, './templates/mail/notification');
        let template = new EmailTemplate.EmailTemplate(dir);

        return template.render({
            name: options.name,
            unread: options.unread,
            notificationsLink: 'https://rudl.me/notifications',
            notificationSettingsLink: 'https://rudl.me/settings/notifications',
            address: address
        }, options.locale as any).then((results: EmailTemplateResults) => {
            return MailManager.sendMail({
                to: options.to,
                subject: results.subject,
                text: results.text,
                html: results.html,
                answerable: false
            });
        });
    }


    static sendNewsletterMails(options: NewsletterMailOptions): Promise<void> {
        let dir = Path.resolve(__dirname, './templates/mail/newsletter');
        let template = new EmailTemplate.EmailTemplate(dir);

        return template.render({
            name: options.name,
            subject: options.subject,
            text: options.text,
            notificationSettingsLink: 'https://rudl.me/settings/notifications',
            address: address
        }, options.locale as any).then((results: EmailTemplateResults) => {
            return MailManager.sendMail({
                to: options.to,
                subject: results.subject,
                text: results.text,
                html: results.html,
                answerable: options.answerable
            });
        });
    }
}

export interface WelcomeMailOptions {
    to: string;
    name: string;
    provider: string;
    locale: Locale;
}

export interface ResetPasswordMailOptions {
    to: string;
    name: string;
    resetPasswordLink: string;
    locale: Locale;
}

export interface NotificationMailOptions {
    to: string;
    name: string;
    unread: number;
    locale: Locale;
}

export interface NewsletterMailOptions {
    to: string;
    name: string;
    subject: string;
    text: string;
    answerable: boolean;
    locale: Locale;
}

export interface MailOptions {
	to: string;
	answerable: boolean,
	subject: string,
	text: string,
	html: string
}

