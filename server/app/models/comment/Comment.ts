import * as Joi from 'joi';
import {Node} from '../Node';

export interface Comment extends Node {
	message: string;
	pinned: boolean;
}

export const CommentValidation = {
	message: Joi.string().min(5).max(300).trim().required(),
	pinned: Joi.boolean().required()
};
