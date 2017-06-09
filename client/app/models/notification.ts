import {Document} from './document';
import {User, UserPreview} from './user';
import {NotificationType} from '../../../server/app/models/notification/Notification';
import {ListPreview} from './list';
import {RudelPreview} from './rudel';
import {ExpeditionPreview} from './expedition';

export interface Notification extends Document {
	type: NotificationType;
	sender: UserPreview;
	subject: UserPreview | RudelPreview | ListPreview | ExpeditionPreview
}
