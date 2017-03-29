import { Component, Input, EventEmitter, Output, HostBinding } from "@angular/core";
import * as moment from "moment";
import Moment = moment.Moment;
import {trigger, transition, style, animate} from "@angular/animations";

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
	
	@Input() dirty: boolean;
	@Output() datetimeSelected: EventEmitter<string> = new EventEmitter();
	
	@Input() set locale(string: string) {
		this.selectedMoment.locale(string);
		this.invalidate();
	}
	
	@Input() set dateTime(string: string) {
		this.selectedMoment = moment.utc(string, DateTimeComponent.format).second(0).milliseconds(0).local();
		this.invalidate();
	}
	
	@Input() set minDateTime(string: string) {
		this.minMoment = moment.utc(string, DateTimeComponent.format).second(0).milliseconds(0).local();
		this.invalidate();
	}
	
	@HostBinding('class.focused') get focused() {
		return this.state != 'collapsed';
	}
    
	selectedMoment: Moment = moment().add(1, 'days').add(1, 'hours').add(15, 'minutes');
	minMoment: Moment = moment().add(1, 'hours');
	state: 'collapsed' | 'day' | 'hour' | 'minute' = 'collapsed';
	items: {[key: string]: Array<CalendarItem | false>} = {
		days: [],
		minutes: [],
		hours: [],
	};
	legends: {[key: string]: string[]} = {
		weekdays: [0,1,2,3,4,5,6].map(i => moment.weekdaysShort(true, i))
	};
	
	invalidate(): void {
		// Days.
		this.items.days = [];
		
		// Days of previous month.
		let prefixedDays = this.selectedMoment.clone().startOf('month').isoWeekday();
		for(let i = 1; i < prefixedDays; i++) this.items.days.push(false);
		
		// Days of current month.
		let days = this.selectedMoment.daysInMonth();
		for(let i = 1; i <= days; i++) {
			let day = this.selectedMoment.clone().date(i);
			this.items.days.push({
				selected: this.selectedMoment.date() == day.date(),
				inactive: this.minMoment.isAfter(day, 'day'),
				value: day.date(),
				formatted: day.date()
			});
		}
		
		// Days of next month.
		let suffixDays = 7 - this.selectedMoment.clone().endOf('month').isoWeekday();
		for(let i = 0; i < suffixDays; i++) this.items.days.push(false);
		
		// Hours.
		this.items.hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(i => {
			let hour = this.selectedMoment.clone().hour(i).minute(0);
			return {
				selected: this.selectedMoment.hour() == hour.hour(),
				inactive: !this.minMoment.isBefore(hour, 'hour'),
				value: hour.hour(),
				formatted: hour.format('LT').replace(/:00/gi, '')
			}
		});
		
		// Minutes.
		this.items.minutes = [0,15,30,45].map(i => {
			let minute = this.selectedMoment.clone().minute(i);
			return {
				selected: this.selectedMoment.minute() == minute.minute(),
				inactive: this.minMoment.isAfter(minute, 'minute'),
				value: minute.minute(),
				formatted: minute.format(':mm')
			}
		});
	}
	
	toggleExpandState() {
		if(this.state == 'collapsed')
			this.nextState();
		else
			this.initialState();
	}
	
	add(amount: number, type: any) {
		this.selectedMoment.add(amount, type);
		this.invalidate();
	}
	
	set(value: number, type: any) {
		this.selectedMoment.set(type, value);
		this.invalidate();
	}
	
	initialState(): void {
		this.state = 'collapsed';
		this.dirty = true;
		this.datetimeSelected.emit(this.dateTime);
	}
	
	nextState(): void {
		// Change state.
		switch(this.state) {
			case 'collapsed':
				this.state = 'day';
				break;
			
			case 'day':
				this.state = 'hour';
				break;
			
			case 'hour':
				this.state = 'minute';
				break;
			
			case 'minute':
				this.initialState();
				break;
		}
	}
}

interface CalendarItem {
	selected: boolean,
	inactive: boolean,
	value: number,
	formatted: string | number
}
