import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseMatField } from '../base-mat-field';

@Component({
    selector: 'zg-mat-datepicker',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ field.label }}</mat-label>
      
      <input matInput 
        [matDatepicker]="picker" 
        [value]="state.value()"
        [placeholder]="field.config.placeholder || ''"
        (dateChange)="state.value.set($event.value)"
        (blur)="onBlur()">
      
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>

      @if (field().config.hint) {
        <mat-hint>{{ field().config.hint }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ZgMatDatepickerComponent extends BaseMatField<Date> {}