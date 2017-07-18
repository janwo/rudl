import {Component, OnInit} from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'legal-about.component.html',
	styleUrls: ['legal-about.component.scss']
})
export class LegalAboutComponent implements OnInit{
	
	constructor(
        private title: Title
    ) {}

    ngOnInit(): void {
	    this.title.setTitle('Impressum | rudl.me');
    }
}
