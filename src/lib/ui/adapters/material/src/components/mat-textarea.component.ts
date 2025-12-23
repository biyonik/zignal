import { Component, computed } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseMatField } from '../base-mat-field';
import { TextareaFieldConfig } from '@biyonik/zignal';

@Component({
    selector: 'zg-mat-textarea',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule],
    template: `
    <mat-form-field 
      [appearance]="matConfig.appearance || 'fill'"
      [color]="matConfig.color || 'primary'"
      style="width: 100%">
      
      <mat-label>{{ field.label }}</mat-label>
      
      <textarea matInput
        [value]="state.value() ?? ''"
        [placeholder]="field.config.placeholder || ''"
        [rows]="textareaConfig()?.rows ?? 3"
        [disabled]="context().disabled ?? false"
        [readonly]="field.config.readonly ?? false"
        (input)="onChange($any($event.target).value)"
        (blur)="onBlur()">
      </textarea>

      @if (textareaConfig()?.maxLength) {
        <mat-hint align="end">
          {{ (state.value()?.length ?? 0) }} / {{ textareaConfig()?.maxLength }}
        </mat-hint>
      } @else if (field.config.hint) {
        <mat-hint>{{ field.config.hint }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ZgMatTextareaComponent extends BaseMatField<string> {
    readonly textareaConfig = computed((): TextareaFieldConfig | null => {
        return this.field.config as TextareaFieldConfig;
    });
}
