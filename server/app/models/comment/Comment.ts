import {Edge} from '../Edge';
import * as Joi from 'joi';

export interface Comment extends Edge {
	message: string;
	pinned: boolean;
}

export const CommentValidation = {
	message: Joi.string().min(5).max(300).required(),
	pinned: Joi.boolean().required()
};
