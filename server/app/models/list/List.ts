import {Translations, TranslationsValidation} from "../Translations";
import {Document} from "../Document";
import * as Joi from "joi";

export interface List extends Document {
	translations: Translations;
}

export const ListValidation = {
	
	translations: TranslationsValidation.required(),
	activities: Joi.array().items(Joi.string()).optional(),
	icon: Joi.number().required()
}
