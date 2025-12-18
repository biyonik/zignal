import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BaseMatField } from '../base-mat-field';
import { SelectFieldConfig } from '@biyonik/zignal';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
    selector: 'zg-mat-chips',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatChipsModule,
        MatIconModule,
        MatAutocompleteModule
    ],
    template: `
    <mat-form-field style="width: 100%">
      <mat-label>{{ field.label }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="field.label">
        @for (val of selectedOptions(); track val.value) {
          <mat-chip-row (removed)="remove(val.value)">
            {{ val.label }}
            <button matChipRemove [attr.aria-label]="'remove ' + val.label">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
      </mat-chip-grid>
      <input
        [placeholder]="field.config.placeholder || ''"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
        (blur)="onBlur()"
      />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
        @for (option of remainingOptions(); track option.value) {
          <mat-option [value]="option.value">
            {{ option.label }}
          </mat-option>
        }
      </mat-autocomplete>

      @if (field.config.hint) {
        <mat-hint>{{ field.config.hint }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ZgMatChipsComponent extends BaseMatField<any[]> {
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    /**
     * TR: Tüm seçenekleri computed olarak çeker.
     */
    readonly allOptions = computed(() => {
        const config = this.field.config as SelectFieldConfig<any>;
        return config.options || [];
    });

    /**
     * TR: Seçili olan değerlerin etiketlerini (label) bulur.
     */
    readonly selectedOptions = computed(() => {
        const currentValues = this.state.value() || [];
        return this.allOptions().filter(opt => currentValues.includes(opt.value));
    });

    /**
     * TR: Henüz seçilmemiş olan seçenekleri listeler (Autocomplete için).
     */
    readonly remainingOptions = computed(() => {
        const currentValues = this.state.value() || [];
        return this.allOptions().filter(opt => !currentValues.includes(opt.value));
    });

    /**
     * TR: Listeden bir değer çıkarır.
     */
    remove(value: any): void {
        const currentValues = this.state.value() || [];
        this.state.value.set(currentValues.filter(v => v !== value));
    }

    /**
     * TR: Autocomplete listesinden seçim yapıldığında çalışır.
     */
    selected(event: MatAutocompleteSelectedEvent): void {
        const currentValues = this.state.value() || [];
        if (!currentValues.includes(event.option.value)) {
            this.state.value.set([...currentValues, event.option.value]);
        }
    }
}