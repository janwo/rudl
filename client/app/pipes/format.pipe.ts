import {Pipe, PipeTransform, SecurityContext} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";

@Pipe({
	name: 'format'
})
export class FormatPipe implements PipeTransform {
	
	constructor(
		private sanitized: DomSanitizer
	) {}
	
	transform(text: string) {
		// Sanitize.
		text = this.sanitized.sanitize(SecurityContext.HTML, text);
		
		// Replacement strategies.
		let replacementStrategies = [
			{
				className: 'bold',
				regExp: /\*\*(.*)\*\*/
			},
			{
				className: 'italic',
				regExp: /\*(.*)\*/
			}
		];
		
		// Replace.
		let safeHTML = replacementStrategies.reduce((text: string, replacementStrategy: {
			className: string,
			regExp: RegExp
		}) => {
			return text.replace(replacementStrategy.regExp, (...match: string[]) => {
				return `<span class="${replacementStrategy.className}">${match[1]}</span>`;
			});
		}, text);
		return this.sanitized.bypassSecurityTrustHtml(safeHTML);
	}
}
