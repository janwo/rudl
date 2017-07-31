import {Component, ViewEncapsulation} from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';

@Component({
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss'],
	encapsulation: ViewEncapsulation.Emulated,
	selector: 'app'
})
export class AppComponent {
	
	constructor(meta: Meta, title: Title) {
		title.setTitle('Entdecke den Puls deiner Stadt! | rudl.me');
		meta.addTags([
			{
				name: 'description',
				content: 'Bei rudl einfach und entspannt die eigene Stadt kennenlernen, gleichgesinnte Menschen finden und die Freizeitgestaltung transparenter und einfach planbar gestalten.'
			}
		]);
	}
}
