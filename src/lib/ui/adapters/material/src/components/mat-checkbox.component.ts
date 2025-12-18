import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseMatField } from '../base-mat-field';

@Component({
    selector: 'zg-mat-checkbox',
    standalone: true,
    imports: [CommonModule, MatCheckboxModule],
    template: `
    <div class="zg-mat-checkbox-container" style="margin-bottom: 1rem;">
      <mat-checkbox
        [color]="matConfig.color || 'primary'"
        [checked]="state.value()"
        (change)="state.value.set($event.checked)"
        (blur)="onBlur()">
        {{ field.label }}
      </mat-checkbox>

        @if (field.config.hint) {
            <div class="zg-mat-hint" style="font-size: 12px; color: rgba(0,0,0,.6); margin-left: 28px;">
                {{ field.config.hint }}
            </div>
        }

        @if (error()) {
            <div class="zg-mat-error" style="font-size: 12px; color: #f44336; margin-left: 28px; margin-top: 4px;">
                {{ error() }}
            </div>
        }
    </div>
  `
})
export class ZgMatCheckboxComponent extends BaseMatField<boolean> {}