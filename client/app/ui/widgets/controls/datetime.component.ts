import {
	Component, Input, EventEmitter, Output, HostBinding, HostListener, trigger,
	style, transition, animate
} from "@angular/core";
import * as moment from "moment";
import Moment = moment.Moment;

@Component({
	templateUrl: 'datetime.component.html',
	styleUrls: ['datetime.component.scss'],
	selector: 'datetime',
	animations: [
		trigger('datetime', [
			transition(':enter', [
				style({
					opacity: 0,
					height: 0
				}),
				animate('0.3s ease-in', style({
					opacity: 1,
					height: '*'
				}))
			]),
			transition(':leave', [
				style({
					opacity: 1,
					height: '*'
				}),
				animate('0.3s ease-in', style({
					opacity: 0,
					height: 0
				}))
			])
		])
	]
})
export class DateTimeComponent {

    static format: string = 'DD-MM-YYYY HH:mm';
    
	selectedMoment: Moment = moment().add(1, 'days').add(1, 'hours').add(15, 'minutes');
	minMoment: Moment = moment().add(1, 'hours');
	state: 'collapsed' | 'date' | 'hour' | 'minute' = 'collapsed';
	
	@Output() change: EventEmitter<string> = new EventEmitter();
	@Input() dirty: boolean;
	
	@Input() set locale(string: string) {
		this.selectedMoment.locale(string);
	}
	
	@Input() set dateTime(string: string) {
		this.selectedMoment = moment.utc(string, DateTimeComponent.format).second(0).milliseconds(0).local();
	}
	
	@Input() set minDateTime(string: string) {
		this.minMoment = moment.utc(string, DateTimeComponent.format).second(0).milliseconds(0).local();
	}
	
	@HostBinding('class.focused') get focused() {
		return this.state != 'collapsed';
	}
	
	@HostListener('click', ['$event'])
	click(event: Event){
		if(this.state != 'collapsed') return;
		this.state = 'date';
		event.preventDefault();
		event.stopPropagation();
	}
	
	add(event: Event, amount: number, type: any) {
		event.preventDefault();
		event.stopPropagation();
		
		// Modify date.
		this.selectedMoment.add(amount, type);
	}
	
	set(event: Event, value: number, type: any) {
		event.preventDefault();
		event.stopPropagation();
		
		// Modify date.
		this.selectedMoment.set(type, value);
		
		// Change state.
		switch(type) {
			case 'date':
				this.state = 'hour';
			break;
			
			case 'hours':
				this.state = 'minute';
			break;
			
			case 'minutes':
				this.state = 'collapsed';
				this.emit();
			break;
		}
	}
	
	emit(): void {
		this.dirty = true;
		this.change.emit(this.dateTime);
	}
    
    getDateItems(): Array<CalendarItem | false> {
		console.log('Generate date time');
		let output : Array<CalendarItem | false> = [];
		// Days of previous month.
	    let prefixedDays = this.selectedMoment.clone().startOf('month').isoWeekday();
	    for(let i = 1; i < prefixedDays; i++) output.push(false);
	
	    // Days of current month.
	    let days = this.selectedMoment.daysInMonth();
	    for(let i = 1; i <= days; i++) {
		    let day = this.selectedMoment.clone().date(i);
		    output.push({
			    selected: this.selectedMoment.date() == day.date(),
			    inactive: this.minMoment.isAfter(day, 'day'),
			    value: day.date(),
			    formatted: day.date()
		    });
	    }
	    
	    // Days of next month.
	    let suffixDays = 7 - this.selectedMoment.clone().endOf('month').isoWeekday();
	    for(let i = 0; i < suffixDays; i++) output.push(false);
	    
		return output;
    }
	
	getHourItems():  CalendarItem[] {
		return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(i => {
			let hour = this.selectedMoment.clone().hour(i).minute(0);
			return {
				selected: this.selectedMoment.hour() == hour.hour(),
				inactive: !this.minMoment.isBefore(hour, 'hour'),
				value: hour.hour(),
				formatted: hour.format('LT').replace(/:00/gi, '')
			}
		});
	}
	
	getMinuteItems(): CalendarItem[]  {
		return [0,15,30,45].map(i => {
			let minute = this.selectedMoment.clone().minute(i);
			return {
				selected: this.selectedMoment.minute() == minute.minute(),
				inactive: this.minMoment.isAfter(minute, 'minute'),
				value: minute.minute(),
				formatted: minute.format(':mm')
			}
		});
	}
	
	getDateLegend(): string[]  {
		return [0,1,2,3,4,5,6].map(i => moment.weekdaysShort(true, i))
	}
	
	collapse(event: Event) {
		if(this.state == 'collapsed') return;
		this.state = 'collapsed';
		event.preventDefault();
		event.stopPropagation();
	}
}

interface CalendarItem {
	selected: boolean,
	inactive: boolean,
	value: number,
	formatted: string | number
}
