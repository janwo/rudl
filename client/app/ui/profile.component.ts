import {Component, OnInit, OnDestroy, Input} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
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
    
    @Input() currentTab: TabItem;
    
    user: User;
    activities: Activity[] = [];
    lists: List[] = [];
    followers: User[] = [];
    followees: User[] = [];
    userSubscription: Subscription;
    userListsSubscription: Subscription;
    userActivitySubscription: Subscription;
    userFollowersSubscription: Subscription;
    userFolloweesSubscription: Subscription;
    
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    tabItems: {[key: string]: TabItem} = {
        activities: {
            icon: 'heart-o',
            title: 'Interessen',
            link: this.router.createUrlTree(['../', 'activities'], {
                relativeTo: this.route
            }),
            notification: false
        },
        lists: {
            icon: 'list',
            title: 'Listen',
            link: this.router.createUrlTree(['../', 'lists'], {
                relativeTo: this.route
            }),
            notification: false
        },
        followees: {
            icon: 'users',
            title: 'Folgt',
            link: this.router.createUrlTree(['../', 'followees'], {
                relativeTo: this.route
            }),
            notification: false
        },
        followers: {
            icon: 'users',
            title: 'Follower',
            link: this.router.createUrlTree(['../', 'followers'], {
                relativeTo: this.route
            }),
            notification: false
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
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let slug = params['tab'];
            if(this.tabItems[slug]) this.currentTab = this.tabItems[slug];
            
            // Get user.
            let username = params['username'];
            if(!this.userSubscription) this.userSubscription = this.userService.get(username).subscribe((user: User) => this.user = user);
            
            // Tab specific resources.
            if(!this.userSubscription) this.userSubscription = this.userService.get(username).subscribe((user: User) => this.user = user);
            if(!this.userListsSubscription && this.currentTab == this.tabItems['lists']) this.userListsSubscription = this.listService.by(username).subscribe((lists: List[]) => this.lists = lists);
            if(!this.userActivitySubscription && this.currentTab == this.tabItems['activities']) this.userActivitySubscription = this.activityService.by(username).subscribe((activities: Activity[]) => this.activities = activities);
            if(!this.userFollowersSubscription && this.currentTab == this.tabItems['followers']) this.userFollowersSubscription = this.userService.followers(username).subscribe((followers: User[]) => this.followers = followers);
            if(!this.userFolloweesSubscription && this.currentTab == this.tabItems['followees']) this.userFolloweesSubscription = this.userService.followees(username).subscribe((followees: User[]) => this.followees = followees);
        });
    }
    
    ngOnDestroy(): void {
        if(this.userSubscription) this.userSubscription.unsubscribe();
        if(this.userListsSubscription) this.userListsSubscription.unsubscribe();
        if(this.userActivitySubscription) this.userActivitySubscription.unsubscribe();
        if(this.userFollowersSubscription) this.userFollowersSubscription.unsubscribe();
        if(this.userFolloweesSubscription) this.userFolloweesSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        this.pendingFollowRequest = true;
        let obs = this.user.relations.isFollowee ? this.userService.unfollow(this.user.username) : this.userService.follow(this.user.username);
        obs.do((updatedUser: User) => {
            this.user = updatedUser;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
}
