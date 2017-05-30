import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

@Component({
	templateUrl: 'emoji.component.html',
	styleUrls: ['emoji.component.scss'],
	selector: 'emoji'
})
export class EmojiComponent implements OnInit {
	
	@Input() emoji: string;
	emojiBackgroundSource: SafeStyle;
	
	constructor(private sanitizer: DomSanitizer) {}
	
	ngOnInit() {
		// Sanitize style.
		this.emojiBackgroundSource = this.sanitizer.bypassSecurityTrustStyle(`url(${this.emoji})`);
	}
}
