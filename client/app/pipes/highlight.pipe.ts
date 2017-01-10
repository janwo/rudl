import {Pipe, PipeTransform, SecurityContext} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";

@Pipe({
	name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
	
	constructor(
		private sanitized: DomSanitizer
	) {}
	
	transform(text: string, highlight: string, className: string = 'highlight') {
		// Sanitize.
		text = this.sanitized.sanitize(SecurityContext.HTML, text);
		highlight = this.sanitized.sanitize(SecurityContext.HTML, highlight);
		className = this.sanitized.sanitize(SecurityContext.HTML, className);
		
		// Created escaped regex.
		let regex = new RegExp(highlight.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, substring => `\\${substring}`), 'i');
		
		// Replace.
		let safeHTML = text.replace(regex, substring => `<span class="${className}">${substring}</span>`);
		return this.sanitized.bypassSecurityTrustHtml(safeHTML);
	}
}
