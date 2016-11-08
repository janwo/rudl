import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ButtonStyles} from "./widgets/styled-button.component";
import {TabItem} from "./widgets/tab-menu.component";
import {User} from "../models/user";
import {List} from "../models/list";

@Component({
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
    
    user: User;
    userSubscription: Subscription;
    userListsSubscription: Subscription;
    userActivitySubscription: Subscription;
    userFollowersSubscription: Subscription;
    userFolloweesSubscription: Subscription;
    
    enableFollowButton: boolean = true;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    public static tabs: { [key: string]: ProfileTab } = {
        activity: {
            icon: 'bell-o',
            title: 'Verlauf',
            slug: 'activity'
        },
        lists: {
            icon: 'list',
            title: 'Listen',
            slug: 'lists'
        },
        followees: {
            icon: 'users',
            title: 'Folgt',
            slug: 'followees'
        },
        followers: {
            icon: 'users',
            title: 'Follower',
            slug: 'followers'
        }
    };
    
    tabItems: Array<TabItem>;
    currentTab: ProfileTab = null;
    private lists: List[];
    private followers: User[];
    private followees: User[];
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
    ) {}
    
    private generateTabItems(): Array<TabItem> {
        return Object.keys(ProfileComponent.tabs).reduce((tabItems: Array<TabItem>, tabKey: string) => {
            // Get tab item.
            let tab = ProfileComponent.tabs[tabKey];
            
            // Create link.
            let urlTree = this.router.createUrlTree(['../', tab.slug], {
                relativeTo: this.route
            });
            
            // Convert.
            tabItems[tabKey] = {
                icon: tab.icon,
                link: urlTree,
                title: tab.title,
                notification: false
            };
            
            return tabItems;
        }, []);
    }
    
    ngOnInit(): void {
        // Create tab items out of the definition of profile tabs.
        this.tabItems = this.generateTabItems();
        
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let slug = params['tab'];
            Object.keys(ProfileComponent.tabs).map(key => ProfileComponent.tabs[key]).every(tab => {
                if(tab.slug !== slug) return true;
                this.currentTab = tab;
                return false;
            });
            
            // Get user.
            let username = params['username'];
            if(!this.userSubscription) this.userSubscription = this.userService.getUser(username).subscribe((user: User) => this.user = user);
            
            // Tab specific resources.
            if(!this.userSubscription) this.userSubscription = this.userService.getUser(username).subscribe((user: User) => this.user = user);
            if(!this.userListsSubscription && this.currentTab == ProfileComponent.tabs['lists']) this.userListsSubscription = this.userService.lists(username).subscribe((lists: List[]) => this.lists = lists);
            //if(!this.userActivitySubscription && this.currentTab == ProfileComponent.tabs['activity']) this.userActivitySubscription = this.userService.getUser(username).subscribe((user: User) => this.user = user);
            if(!this.userFollowersSubscription && this.currentTab == ProfileComponent.tabs['followers']) this.userFollowersSubscription = this.userService.followers(username).subscribe((followers: User[]) => this.followers = followers);
            if(!this.userFolloweesSubscription && this.currentTab == ProfileComponent.tabs['followees']) this.userFolloweesSubscription = this.userService.followees(username).subscribe((followees: User[]) => this.followees = followees);
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
        this.enableFollowButton = false;
        let obs = this.user.relations.followee ? this.userService.deleteFollowee(this.user.username).map(() => false) : this.userService.addFollowee(this.user.username).map(() => true);
        obs.do((isFollowee: boolean) => {
            this.user.relations.followee = isFollowee;
            this.enableFollowButton = true;
        }).subscribe();
    }
}

interface ProfileTab {
    slug: string;
    title: string;
    icon: string;
}
