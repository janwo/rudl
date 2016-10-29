import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService, User} from "../user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ButtonStyles} from "./widgets/styled-button.component";
import {TabItem} from "./widgets/tab-menu.component";
import {SettingsComponent} from "./settings.component";

@Component({
    template: require('./profile.component.html'),
    styles: [require('./profile.component.scss')]
})
export class ProfileComponent implements OnInit, OnDestroy {
    
    user: User;
    userSubscription: Subscription;
    
    enableFollowButton: boolean = true;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    public static tabs: Array<ProfileTab> = [
        {
            icon: 'bell-o',
            title: 'Verlauf',
            slug: 'activity'
        },
        {
            icon: 'list',
            title: 'Listen',
            slug: 'lists'
        },
        {
            icon: 'users',
            title: 'Folgt',
            slug: 'followees'
        },
        {
            icon: 'users',
            title: 'Follower',
            slug: 'followers'
        }
    ];
    
    tabItems: Array<TabItem>;
    currentTab: ProfileTab = null;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
    ) {}
    
    private generateTabItems(): Array<TabItem> {
        return ProfileComponent.tabs.reduce((tabItems: Array<TabItem>, currentTab: ProfileTab) => {
            // Create link.
            let urlTree = this.router.createUrlTree(['../', currentTab.slug], {
                relativeTo: this.route
            });
            
            // Convert.
            tabItems.push({
                icon: currentTab.icon,
                link: urlTree,
                title: currentTab.title,
                notification: false
            });
            
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
            ProfileComponent.tabs.every(tab => {
                if(tab.slug !== slug) return true;
                this.currentTab = tab;
                return false;
            });
            
            // Get user.
            let username = params['username'];
            this.userSubscription = this.userService.getUser(username).subscribe((user: User) => this.user = user);
        });
    }
    
    ngOnDestroy(): void {
        this.userSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        this.enableFollowButton = false;
        let obs = this.user.relation.followee ? this.userService.deleteFollowee(this.user.username).map(() => false) : this.userService.addFollowee(this.user.username).map(() => true);
        obs.do((isFollowee: boolean) => {
            this.user.relation.followee = isFollowee;
            this.enableFollowButton = true;
        }).subscribe();
    }
}

interface ProfileTab {
    slug: string;
    title: string;
    icon: string;
}

@Component({
    template: ''
})
export class RedirectProfileComponent {
    constructor(private router: Router, private route: ActivatedRoute) {
        this.router.navigate([ProfileComponent.tabs[0].slug], {
            relativeTo: this.route,
            skipLocationChange: true
        });
    }
}
