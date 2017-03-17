import {Component, Input, EventEmitter, Output, OnInit} from "@angular/core";
import * as moment from "moment";

@Component({
    templateUrl: 'datetime.component.html',
    styleUrls: ['datetime.component.scss'],
    selector: 'datetime'
})
export class DateTimeComponent implements OnInit {

    moment: moment.Moment = moment().add(1, 'day').hours(15).minutes(0);
    @Output() change: EventEmitter<string> = new EventEmitter();
    
	get datetime(): string {
    	return this.moment.format('MM-DD-YYYY');
	}
	
	@Input()
	set datetime(string: string) {
		this.moment = moment(string, 'MM-DD-YYYY').seconds(0);
		this.moment = this.moment.minutes(Math.round(this.moment.minute() / 15) * 15);
	}
	
    ngOnInit(): void {
    	
    }
    
    emit(): void {
        this.change.emit(this.datetime);
    }
    
    add(amount: number, type: any) {
		this.moment.add(amount, type);
    }
}
