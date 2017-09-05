import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {RudelItemStyles} from '../../widgets/rudel/rudel-item.component';
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {EmptyState} from "../../widgets/state/empty.component";
import {Title} from "@angular/platform-browser";
import {User} from "../../../models/user";
import {UserItemStyles} from "../../widgets/user/user-item.component";
import {UserService} from "../../../services/user.service";

@Component({
	templateUrl: 'explore-user.component.html',
	styleUrls: ['explore-user.component.scss']
})
export class ExploreUserComponent implements OnInit, OnDestroy {

    waveEmoji: string = require('../../../../../db/files/icons/wave.svg');
	suggestedUsersSubscription: Subscription;
	suggestedUsers: User[];
	recentUsersSubscription: Subscription;
	recentUsers: User[];
	userItemStyle: UserItemStyles = UserItemStyles.block;
	userItemButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	pendingRequest: boolean;

	emptyState: EmptyState = {
		title: 'Keine Nutzer gefunden',
		image: require('../../../../assets/illustrations/no-users.png'),
		description: 'Wir konnten dir keine Nutzer vorstellen. Komme später zurück.'
	};

	constructor(private userService: UserService,
				private title: Title) {}
	
	ngOnInit(): void {
		this.title.setTitle('Entdecke Nutzer | rudl.me');

		this.suggestedUsersSubscription = this.userService.suggested().subscribe((user: User[]) => {
			this.suggestedUsers = user;
		});
		
		this.recentUsersSubscription = this.userService.recent().subscribe((user: User[]) => {
			this.recentUsers = user;
		});
	}

    like(user: User): void {
        this.pendingRequest = true;
        this.userService.like(user.username).subscribe((user: User) => {
            this.pendingRequest = false;
            if(this.suggestedUsers) this.suggestedUsers = this.suggestedUsers.map(suggestedUser => {
                return user.id == suggestedUser.id ? user : suggestedUser;
            });

            if(this.recentUsers) this.recentUsers = this.recentUsers.map(recentUser => {
                return user.id == recentUser.id ? user : recentUser;
            });
        });
    }

    dislike(user: User): void {
        this.pendingRequest = true;
        this.userService.dislike(user.username).subscribe(() => {
            this.pendingRequest = false;
            if(this.suggestedUsers) this.suggestedUsers = this.suggestedUsers.filter(suggestedUser => suggestedUser.id != user.id);

            if(this.recentUsers) this.recentUsers = this.recentUsers.filter(recentUser => recentUser.id != user.id);
		});
    }
	
	ngOnDestroy(): void {
		this.suggestedUsersSubscription.unsubscribe();
		this.recentUsersSubscription.unsubscribe();
	}
}
