import * as nodemailer from 'nodemailer';
import {SentMessageInfo, Transporter} from 'nodemailer';
import {Config} from '../../run/config';

export class MailManager {
	
	static instance: MailManager;
	private transporter: Transporter;
	
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: Config.backend.mail.host,
			port: Config.backend.mail.port,
			secure: Config.backend.mail.secure,
			auth: {
				user: Config.backend.mail.auth.user,
				pass: Config.backend.mail.auth.pass
			},
		});
	}
	
	static sendMail(options: MailOptions): Promise<SentMessageInfo> {
		if(!MailManager.instance) MailManager.instance = new MailManager();
		
		// Send Mail.
		return new Promise((resolve, reject) => {
			MailManager.instance.transporter.sendMail({
				from: 'thisdavejdemo@gmail.com',
				to: options.to,
				subject: options.subject,
				html: options.body,
			}, (error: Error, info: SentMessageInfo) => {
				if(error) {
					reject(error);
					return;
				}
				
				resolve(info);
			});
		});
	}
}

export interface MailOptions {
	to: string;
	subject: string,
	body: string
}
