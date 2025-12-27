import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { PhoneField } from '../../../fields/phone.field';

@Component({
    selector: 'zg-phone',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgPhoneComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgPhoneComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-phone-field" [class]="wrapperClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div class="zg-input-wrapper" [class.has-prefix]="prefixText || prefixIcon" [class.has-suffix]="suffixText || suffixIcon">
                <span *ngIf="prefixIcon" class="zg-prefix-icon">{{ prefixIcon }}</span>
                <span *ngIf="prefixText" class="zg-prefix">{{ prefixText }}</span>

                <input
                        type="tel"
                        [id]="field().name"
                        [name]="field().name"
                        [value]="value ?? ''"
                        [placeholder]="placeholder"
                        [disabled]="disabledStatus"
                        [readonly]="readonly()"
                        [attr.autocomplete]="autocompleteValue ?? 'tel'"
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

                <span *ngIf="suffixText" class="zg-suffix">{{ suffixText }}</span>
                <span *ngIf="suffixIcon" class="zg-suffix-icon">{{ suffixIcon }}</span>
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
        .zg-input-wrapper {
            display: flex;
            align-items: center;
        }
        .zg-prefix, .zg-prefix-icon {
            padding: 8px 12px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-right: none;
            border-radius: 6px 0 0 6px;
            font-size: 14px;
            color: #6b7280;
        }
        .zg-suffix, .zg-suffix-icon {
            padding: 8px 12px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-left: none;
            border-radius: 0 6px 6px 0;
            font-size: 14px;
            color: #6b7280;
        }
        .zg-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        .has-prefix .zg-input {
            border-radius: 0 6px 6px 0;
        }
        .has-suffix .zg-input {
            border-radius: 6px 0 0 6px;
        }
        .has-prefix.has-suffix .zg-input {
            border-radius: 0;
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
export class ZgPhoneComponent extends BaseNativeComponent<PhoneField, string> {
    get placeholder(): string {
        const format = this.field().config.country ?? 'TR';
        const placeholders: Record<string, string> = {
            TR: '(5XX) XXX XX XX',
            US: '(XXX) XXX-XXXX',
            INTL: '+XX XXX XXX XXXX',
        };
        return this.field().config.placeholder ?? placeholders[format] ?? '';
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.updateValue(input.value);
    }
}
