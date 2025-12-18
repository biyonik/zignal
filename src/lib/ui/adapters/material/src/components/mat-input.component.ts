import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseMatField } from '../base-mat-field';

@Component({
    selector: 'zg-mat-input',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule],
    template: `
    <mat-form-field 
      [appearance]="matConfig.appearance || 'fill'"
      [color]="matConfig.color || 'primary'"
      style="width: 100%">
      
      <mat-label>{{ field.label }}</mat-label>
      
      <input matInput
        [type]="field.type === 'password' ? 'password' : 'text'"
        [value]="state.value()"
        (input)="state.value.set($any($event.target).value)"
        (blur)="state.touched.set(true)">

      @if (field.config.hint) {
        <mat-hint>{{ field.config.hint }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ZgMatInputComponent extends BaseMatField<string | number> {}