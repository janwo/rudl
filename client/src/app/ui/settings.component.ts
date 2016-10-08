import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {TabItem} from "./widgets/tab-menu.component";

@Component({
    template: require('./settings.component.html'),
    styles: [require('./settings.component.scss')]
})
export class SettingsComponent implements OnInit {
    
    pages: Array<SettingsPage> = [
        {
            title: 'Konto',
            section: 'account'
        },
        {
            title: 'Sicherheit',
            section: 'safety'
        }
    ];
    
    tabItems: Array<TabItem>;
    
    currentPage: SettingsPage;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {
        // Create tab items out of the definition of pages.
        this.tabItems = this.generateTabItems();
    }
    
    private generateTabItems(): Array<TabItem> {
        return this.pages.reduce((tabItems: Array<TabItem>, currentPage: SettingsPage) => {
            // Create link.
            let urlTree = this.router.createUrlTree(['../', currentPage.section], {
                relativeTo: this.route
            });
            
            // Convert.
            tabItems.push({
                link: this.router.serializeUrl(urlTree),
                title: currentPage.title,
                notification: false
            });
            return tabItems;
        }, []);
    }
    
    ngOnInit(): void {
        this.route.params.map((params:Params) => params['section']).subscribe((section: string) => {
            this.pages.every(page => {
                if(page.section !== section) return true;
                this.currentPage = page;
                return false;
            });
        });
    }
}

interface SettingsPage {
    section: string,
    title: string;
}
