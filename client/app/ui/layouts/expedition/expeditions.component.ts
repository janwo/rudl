import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ScrollService} from '../../../services/scroll.service';
import {Expedition} from '../../../models/expedition';
import {ExpeditionService} from '../../../services/expedition.service';
import {EmptyState} from '../../widgets/state/empty.component';

@Component({
	templateUrl: 'expeditions.component.html',
	styleUrls: ['expeditions.component.scss']
})
export class ExpeditionsComponent {}
