import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { PercentField } from '../../../fields/percent.field';

@Component({
    selector: 'zg-percent',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgPercentComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgPercentComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-percent-field" [class]="wrapperClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div class="zg-percent-wrapper">
                <input
                        type="number"
                        [id]="field().name"
                        [name]="field().name"
                        [value]="value"
                        [placeholder]="field().config.placeholder ?? '0'"
                        [disabled]="disabledStatus"
                        [readonly]="readonly()"
                        [min]="field().config.min ?? 0"
                        [max]="field().config.max ?? 100"
                        [step]="field().config.step ?? 1"
                        [attr.tabindex]="tabIndex"
                        [attr.autofocus]="shouldAutofocus ? true : null"
                        [attr.aria-label]="field().label"
                        [attr.aria-invalid]="showError"
                        [class.zg-invalid]="showError"
                        class="zg-input"
                        [class]="inputCssClass"
                        (input)="onInput($event)"
                        (blur)="handleBlur()"
                />
                <span class="zg-percent-symbol">%</span>
            </div>

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
        .zg-percent-wrapper {
            display: flex;
            align-items: center;
        }
        .zg-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px 0 0 6px;
            font-size: 14px;
        }
        .zg-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-input.zg-invalid { border-color: #ef4444; }
        .zg-input:disabled { background-color: #f3f4f6; cursor: not-allowed; }
        .zg-percent-symbol {
            padding: 8px 12px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-left: none;
            border-radius: 0 6px 6px 0;
            font-size: 14px;
            color: #6b7280;
        }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgPercentComponent extends BaseNativeComponent<PercentField, number> {
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.valueAsNumber;
        this.updateValue(isNaN(value) ? null as any : value);
    }
}
