import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {TabItem} from "./widgets/tab-menu.component";

@Component({
    template: require('./settings.component.html'),
    styles: [require('./settings.component.scss')]
})
export class SettingsComponent implements OnInit {
    
    public static pages: Array<SettingsPage> = [
        {
            title: 'Konto',
            slug: 'account'
        },
        {
            title: 'Sicherheit',
            slug: 'safety'
        }
    ];
    
    tabItems: Array<TabItem>;
    
    currentPage: SettingsPage;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    private generateTabItems(): Array<TabItem> {
        return SettingsComponent.pages.reduce((tabItems: Array<TabItem>, currentPage: SettingsPage) => {
            // Create link.
            let urlTree = this.router.createUrlTree(['../', currentPage.slug], {
                relativeTo: this.route
            });
            
            // Convert.
            tabItems.push({
                link: urlTree,
                title: currentPage.title,
                notification: false
            });
            
            return tabItems;
        }, []);
    }
    
    ngOnInit(): void {
        // Create tab items out of the definition of pages.
        this.tabItems = this.generateTabItems();
        
        // Get params.
        this.route.params.map((params:Params) => params['page']).subscribe((slug: string) => {
            SettingsComponent.pages.every(page => {
                if(page.slug !== slug) return true;
                this.currentPage = page;
                return false;
            });
        });
    }
}

interface SettingsPage {
    slug: string;
    title: string;
}
