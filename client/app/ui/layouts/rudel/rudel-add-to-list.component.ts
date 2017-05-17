import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {RudelService} from "../../../services/rudel.service";
import {ExpeditionService} from "../../../services/expedition.service";

@Component({
    templateUrl: 'rudel-add-to-list.component.html',
    styleUrls: ['rudel-add-to-list.component.scss']
})
export class RudelAddToListComponent implements OnInit {
	
    rudel: Rudel;
    
    constructor(
	    private rudelService: RudelService,
	    private expeditionService: ExpeditionService,
	    private router: Router,
        private route: ActivatedRoute
    ) {}
	
    ngOnInit(){
    }
}
