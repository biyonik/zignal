import { Component, computed } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { BaseMatField } from '../base-mat-field';
import { SelectFieldConfig } from '@biyonik/zignal';

@Component({
    selector: 'zg-mat-radio',
    standalone: true,
    imports: [MatRadioModule],
    template: `
    <div class="zg-mat-radio-container">
      <label class="zg-mat-radio-label">{{ field.label }}</label>
      
      <mat-radio-group
        [value]="state.value()"
        [disabled]="context().disabled ?? false"
        (change)="onChange($event.value)">
        
        @for (option of options(); track option.value) {
          <mat-radio-button 
            [value]="option.value"
            [disabled]="option.disabled"
            [color]="matConfig.color || 'primary'">
            {{ option.label }}
          </mat-radio-button>
        }
      </mat-radio-group>

      @if (field.config.hint) {
        <div class="zg-mat-hint" style="font-size: 12px; color: rgba(0,0,0,.6); margin-top: 4px;">
          {{ field.config.hint }}
        </div>
      }

      @if (error()) {
        <div class="zg-mat-error" style="font-size: 12px; color: #f44336; margin-top: 4px;">
          {{ error() }}
        </div>
      }
    </div>
  `,
    styles: [`
    .zg-mat-radio-container {
      margin-bottom: 1rem;
    }
    .zg-mat-radio-label {
      display: block;
      font-size: 12px;
      color: rgba(0,0,0,.6);
      margin-bottom: 8px;
    }
    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
})
export class ZgMatRadioComponent extends BaseMatField<unknown> {
    readonly options = computed(() => {
        const config = this.field.config as SelectFieldConfig<unknown>;
        return config.options || [];
    });
}
