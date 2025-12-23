import { Component } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BaseMatField } from '../base-mat-field';

@Component({
    selector: 'zg-mat-slide-toggle',
    standalone: true,
    imports: [MatSlideToggleModule],
    template: `
    <div class="zg-mat-slide-toggle-container" style="margin-bottom: 1rem;">
      <mat-slide-toggle
        [color]="matConfig.color || 'primary'"
        [checked]="!!state.value()"
        [disabled]="context().disabled ?? false"
        (change)="onChange($event.checked)"
        (blur)="onBlur()">
        {{ field.label }}
      </mat-slide-toggle>

      @if (field.config.hint) {
        <div class="zg-mat-hint" style="font-size: 12px; color: rgba(0,0,0,.6); margin-left: 48px; margin-top: 4px;">
          {{ field.config.hint }}
        </div>
      }

      @if (error()) {
        <div class="zg-mat-error" style="font-size: 12px; color: #f44336; margin-left: 48px; margin-top: 4px;">
          {{ error() }}
        </div>
      }
    </div>
  `
})
export class ZgMatSlideToggleComponent extends BaseMatField<boolean> {}
