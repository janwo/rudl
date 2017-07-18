import {Component, OnInit} from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'legal-privacy.component.html',
	styleUrls: ['legal-privacy.component.scss']
})
export class LegalPrivacyComponent implements OnInit{

	constructor(
		private title: Title
	) {}

	ngOnInit(): void {
		this.title.setTitle('Datenschutz | rudl.me');
	}
}
