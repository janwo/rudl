import {Translations, TranslationsValidation} from "../Translations";
import {Document} from "../Document";
import * as Joi from "joi";
import {Config} from "../../../../run/config";

export interface Activity extends Document {
	translations: Translations;
	defaultLocation: number[]; //TODO
	icon: string
}

export const ActivityValidation = {
	translations: TranslationsValidation.required(),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
