import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BaseMatField } from '../base-mat-field';
import { SelectFieldConfig } from '@biyonik/zignal';

@Component({
    selector: 'zg-mat-select',
    standalone: true,
    imports: [CommonModule, MatFormFieldModule, MatSelectModule],
    template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ field.label }}</mat-label>
      
      <mat-select
        [value]="state.value()"
        [placeholder]="field.config.placeholder || ''"
        (selectionChange)="state.value.set($event.value)"
        (blur)="onBlur()">
        
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>

      @if (field.config.hint) {
        <mat-hint>{{ field.config.hint }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ZgMatSelectComponent extends BaseMatField<any> {
    /**
     * TR: Alan yapılandırmasından seçenekleri (options) güvenli şekilde çeker.
     */
    readonly options = computed(() => {
        const config = this.field.config as SelectFieldConfig<any>;
        return config.options || [];
    });
}