import {Component, OnInit, OnDestroy, Input, ViewChild, AfterViewInit} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription, Subject, Observable} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ButtonStyles} from "./widgets/styled-button.component";
import {TabItem, TabMenuComponent} from "./widgets/tab-menu.component";
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
    tabItems: {[key: string]: TabItem} = {};
    paramsChangedSubscription: Subscription;
    changeFollowStateSubject: Subject<boolean> = new Subject();
    changeFollowStateSubscription: Subscription;
    
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private listService: ListService,
        private activityService: ActivityService
    ) {}
    
    ngOnInit(): void {
        let updateUser = (username: string) => this.userService.get(username).do((user: User) => {
            // Set user.
            this.user = user;
    
            // Update tab item links.
            this.tabItems = {
                activities: {
                    icon: 'heart-o',
                    title: 'Interessen',
                    link: this.router.createUrlTree(['../../', user.username, 'activities'], {
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
        
        // Define changed params subscription.
        this.paramsChangedSubscription = this.route.params.distinctUntilChanged((x, y) => {
            // Only continue if any params changed.
            return x['username'] == y['username'] && x['tab'] == y['tab'];
        }).flatMap(params => {
            // Update user, if username changed.
            let username = params['username'];
            if(this.user && this.user.username == username) return Observable.of(params['tab']);
            return updateUser(username).map(user => params['tab']);
        }).map((tab: string) => {
            // Set tab item.
            this.tab = this.tabItems[tab];
    
            // Map to tab specific resources.
            switch (tab) {
                case 'lists':
                    return this.listService.by(this.user.username).do((lists: List[]) => this.lists = lists);
                case 'activities':
                    return this.activityService.by(this.user.username).do((activities: Activity[]) => this.activities = activities);
                case 'followers':
                    return this.userService.followers(this.user.username).do((followers: User[]) => this.followers = followers);
                case 'followees':
                    return this.userService.followees(this.user.username).do((followees: User[]) => this.followees = followees);
                default:
                    return Observable.empty();
            }
        }).subscribe();
        
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
