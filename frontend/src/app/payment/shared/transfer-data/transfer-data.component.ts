import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'custom-transfer-data',
  templateUrl: './transfer-data.component.html',
  styleUrls: ['./transfer-data.component.css']
})
export class TransferDataComponent implements OnInit {
  @Input() paymentType: string;
  @Input() itemName: string;
  @Input() itemId: string;
  @Input() value: string;
  @Input() disabled: boolean;
  @Output() clicked: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
    console.log(this.disabled);
  }

  pay() {
    this.clicked.emit();
  }

}
