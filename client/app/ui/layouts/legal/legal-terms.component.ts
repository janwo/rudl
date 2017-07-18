import {Component, OnInit} from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'legal-terms.component.html',
	styleUrls: ['legal-terms.component.scss']
})
export class LegalTermsComponent implements OnInit{

	constructor(
		private title: Title
	) {}

	ngOnInit(): void {
		this.title.setTitle('Nutzungsbedingungen | rudl.me');
	}
}
