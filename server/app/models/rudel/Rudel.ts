import {Translations, TranslationsValidation} from "../Translations";
import {Node} from "../Node";
import * as Joi from "joi";
import {Config} from "../../../../run/config";

export interface Rudel extends Node {
	translations: Translations;
	defaultLocation: {
		lng: number,
		lat: number,
	};//TODO Median über alle Locations von öffentlichen Expeditions, bei jedem erstellen und löschen von expeditions neu generieren
	icon: string;
}

export const RudelValidation = {
	translations: TranslationsValidation.required(),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
