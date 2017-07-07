import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {EmptyState} from '../../widgets/state/empty.component';
import {Title} from '@angular/platform-browser';
@Component({
	templateUrl: '404.component.html',
	styleUrls: ['404.component.scss']
})
export class NotFoundComponent implements OnInit {
	
	emptyState: EmptyState;
	
	constructor(private route: ActivatedRoute,
	            title: Title) {
		title.setTitle('Seite nicht gefunden | rudl.me'); //rudl.me - Page not found
	}
	
	ngOnInit() {
		this.route.data.subscribe(data => {
			this.emptyState = {
				title: data.title,
				image: data.image,
				description: data.description
			};
		});
	}
}
