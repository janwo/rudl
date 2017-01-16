import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {TabItem} from "./widgets/tab-menu.component";

@Component({
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    
    public static pages: {[key: string]: SettingsPage} = {
        account: {
            title: 'Konto',
            slug: 'account'
        },
       safety: {
            title: 'Sicherheit',
            slug: 'safety'
        }
    };
    
    tabItems: {[key: string]: TabItem};
    
    currentPage: SettingsPage;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    private generateTabItems(): {[key: string]: TabItem} {
        return Object.keys(SettingsComponent.pages).reduce((tabItems: {[key: string]: TabItem}, pageKey: string) => {
            let page = SettingsComponent.pages[pageKey];
            
            // Create link.
            let urlTree = this.router.createUrlTree(['../', page.slug], {
                relativeTo: this.route
            });
            
            // Convert.
            tabItems[pageKey] = {
                link: urlTree,
                title: page.title,
                notification: false
            };
            
            return tabItems;
        }, {});
    }
    
    ngOnInit(): void {
        // Create tab items out of the definition of pages.
        this.tabItems = this.generateTabItems();
        
        // Get params.
        this.route.params.map((params:Params) => params['page']).subscribe((slug: string) => {
            Object.keys(SettingsComponent.pages).map(key => SettingsComponent.pages[key]).every(page => {
                if(page.slug !== slug) return true;
                this.currentPage = page;
                return false;
            });
        });
    }
}

export interface SettingsPage {
    slug: string;
    title: string;
}
