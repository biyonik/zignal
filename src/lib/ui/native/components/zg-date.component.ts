import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { DateField } from '../../../fields/date.field';

@Component({
    selector: 'zg-date',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgDateComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgDateComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-date-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <input
                type="date"
                [id]="field().name"
                [name]="field().name"
                [value]="dateValue"
                [min]="minDate"
                [max]="maxDate"
                [disabled]="disabledStatus"
                [readonly]="readonly()"
                [attr.aria-label]="field().label"
                [attr.aria-invalid]="showError"
                [class.zg-invalid]="showError"
                class="zg-input"
                (input)="onInput($event)"
                (blur)="handleBlur()"
            />

            <small *ngIf="field().config.hint && !showError" class="zg-hint">
                {{ field().config.hint }}
            </small>

            <small *ngIf="showError" class="zg-error">
                {{ error }}
            </small>
        </div>
    `,
    styles: [`
        .zg-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 16px;
        }
        .zg-label { font-weight: 500; font-size: 14px; }
        .zg-required { color: #ef4444; }
        .zg-input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        .zg-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-input.zg-invalid { border-color: #ef4444; }
        .zg-input:disabled { background-color: #f3f4f6; cursor: not-allowed; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgDateComponent extends BaseNativeComponent<DateField, Date> {
    get dateValue(): string {
        if (!this.value) return '';
        const date = this.value instanceof Date ? this.value : new Date(this.value);
        return date.toISOString().split('T')[0];
    }

    get minDate(): string | null {
        const min = this.field().config.min;
        if (!min) return null;
        const date = min instanceof Date ? min : new Date(min);
        return date.toISOString().split('T')[0];
    }

    get maxDate(): string | null {
        const max = this.field().config.max;
        if (!max) return null;
        const date = max instanceof Date ? max : new Date(max);
        return date.toISOString().split('T')[0];
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const date = input.valueAsDate;
        this.updateValue(date as Date);
    }
}
