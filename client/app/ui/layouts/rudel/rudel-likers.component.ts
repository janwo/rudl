import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {User} from '../../../models/user';
import {ScrollService} from '../../../services/scroll.service';
import {RudelComponent} from "./rudel.component";
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'rudel-likers.component.html',
	styleUrls: ['rudel-likers.component.scss']
})
export class RudelLikersComponent implements OnInit, OnDestroy {
	
	likers: User[];
	likersSubscription: Subscription;
	rudel: Rudel;
	
	constructor(private rudelService: RudelService,
	            private route: ActivatedRoute,
				private parent: RudelComponent,
				private title: Title,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.title.setTitle(`Anhänger - Rudel "${this.parent.rudel.name}" | rudl.me`);

		// Define changed params subscription.
		this.likersSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
			this.rudel = data.rudel;
			return this.scrollService.hasScrolledToBottom().map(() => this.likers ? this.likers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.rudelService.likers(this.rudel.id, offset, 25);
			});
		}).subscribe((likers: User[]) => {
			if (likers.length < 25) this.likersSubscription.unsubscribe();
			this.likers = this.likers ? this.likers.concat(likers) : likers;
		});
	}
	
	ngOnDestroy(): void {
		this.likersSubscription.unsubscribe();
	}
}
