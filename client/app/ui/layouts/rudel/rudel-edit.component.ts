import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {ExpeditionService} from '../../../services/expedition.service';

@Component({
	templateUrl: 'rudel-edit.component.html',
	styleUrls: ['rudel-edit.component.scss']
})
export class RudelEditComponent implements OnInit {
	
	rudel: Rudel;
	
	constructor(private rudelService: RudelService,
	            private expeditionService: ExpeditionService,
	            private router: Router,
	            private route: ActivatedRoute) {}
	
	ngOnInit() {
	}
	
}
