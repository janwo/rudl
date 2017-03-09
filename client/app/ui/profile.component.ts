import {Component, OnInit, OnDestroy, Input} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription, Subject, Observable} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {ButtonStyles} from "./widgets/styled-button.component";
import {TabItem} from "./widgets/tab-menu.component";
import {User} from "../models/user";
import {List} from "../models/list";
import {ListService} from "../services/list.service";
import {ActivityService} from "../services/activity.service";
import {Activity} from "../models/activity";

@Component({
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
    
    user: User;
    tab: TabItem;
    @Input() activities: Activity[] = [];
    lists: List[] = [];
    followers: User[] = [];
    followees: User[] = [];
	isLoading: boolean = false;
    tabItems: {[key: string]: TabItem} = {};
    paramsChangedSubscription: Subscription;
    changeFollowStateSubject: Subject<boolean> = new Subject();
    changeFollowStateSubscription: Subscription;
    
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
	emptyStates = {
		followees: {
			title: 'No Followees',
			image: require('../../assets/boarding/radar.png'),
			description: 'You are not following anyone. Why not change that?'
		},
		followers: {
			title: 'No Followers',
			image: require('../../assets/boarding/radar.png'),
			description: 'Nobody follows you. Create events to make yourself visible!'
		},
		lists: {
			title: 'You have no lists',
			image: require('../../assets/boarding/radar.png'),
			description: 'You have no lists created yet. Use them to group your Rudels! Others can follow them.'
		},
		activities: {
			title: 'There are no Rudels',
			image: require('../../assets/boarding/radar.png'),
			description: 'Why not search for new Rudels that you like?'
		}
	};
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private listService: ListService,
        private activityService: ActivityService
    ) {}
    
    ngOnInit(): void {
        let setUser = (username: string) => {
            // User has not changed? Return current one.
            if(this.user && this.user.username == username) return Observable.of(this.user);
	        
            return this.userService.get(username).do((user: User) => {
                // Set user.
                this.user = user;
        
                // Update tab item links.
                this.tabItems = {
                    activities: {
                        icon: 'paw',
                        title: 'Rudel',
                        link: this.router.createUrlTree(['../../', user.username, 'rudel'], {
                            relativeTo: this.route
                        }),
                        notification: false
                    },
                    lists: {
                        icon: 'list',
                        title: 'Listen',
                        link: this.router.createUrlTree(['../../', user.username, 'lists'], {
                            relativeTo: this.route
                        }),
                        notification: false
                    },
                    followees: {
                        icon: 'users',
                        title: 'Folgt',
                        link: this.router.createUrlTree(['../../', user.username, 'followees'], {
                            relativeTo: this.route
                        }),
                        notification: false
                    },
                    followers: {
                        icon: 'users',
                        title: 'Follower',
                        link: this.router.createUrlTree(['../../', user.username, 'followers'], {
                            relativeTo: this.route
                        }),
                        notification: false
                    }
                };
            });
        };
        
        // Define changed params subscription.
        this.paramsChangedSubscription = this.route.params.distinctUntilChanged((x, y) => {
            // Only continue if any params changed.
            return x['username'] == y['username'] && x['tab'] == y['tab'];
        }).do(() => this.isLoading = true).flatMap(params => {
            // Set user.
            return setUser(params['username']).map(() => params['tab']);
        }).subscribe((tab: string) => {
            // Set tab item.
            this.tab = this.tabItems[tab];
	
	        // Map to tab specific resources.
	        switch (tab) {
		        case 'lists':
			        this.tab = this.tabItems['lists'];
			        this.listService.by(this.user.username).subscribe((lists: List[]) => {
				        this.lists = lists;
				        this.isLoading = false
			        });
			        break;
			        
		        case 'rudel':
			        this.tab = this.tabItems['activities'];
			        this.activityService.by(this.user.username).subscribe((activities: Activity[]) => {
				        this.activities = activities;
				        this.isLoading = false;
			        });
			        break;
			        
		        case 'followers':
			        this.tab = this.tabItems['followers'];
			        this.userService.followers(this.user.username).subscribe((followers: User[]) => {
			        	this.followers = followers;
				        this.isLoading = false;
			        });
			        break;
			        
		        case 'followees':
			        this.tab = this.tabItems['followees'];
			        this.userService.followees(this.user.username).subscribe((followees: User[]) => {
			        	this.followees = followees;
			        	this.isLoading = false
			        });
			        break;
	        }
        });
        
        // Define changed follow state subscription.
        this.changeFollowStateSubscription = this.changeFollowStateSubject.asObservable().distinctUntilChanged().flatMap(follow => {
            this.pendingFollowRequest = true;
            return follow ? this.userService.follow(this.user.username) : this.userService.unfollow(this.user.username);
        }).subscribe((updatedUser: User) => {
            this.user = updatedUser;
            this.pendingFollowRequest = false;
        });
    }
    
    ngOnDestroy(): void {
        this.paramsChangedSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        this.changeFollowStateSubject.next(!this.user.relations.isFollowee);
    }
}
