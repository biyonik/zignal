import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { MaskedField } from '../../../fields/masked.field';

@Component({
    selector: 'zg-masked',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgMaskedComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgMaskedComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-masked-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <input
                type="text"
                [id]="field().name"
                [name]="field().name"
                [value]="displayValue"
                [placeholder]="maskPlaceholder"
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
            font-family: monospace;
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
export class ZgMaskedComponent extends BaseNativeComponent<MaskedField, string> {
    get mask(): string {
        return this.field().config.mask ?? '';
    }

    get maskPlaceholder(): string {
        return this.field().config.placeholder ?? this.mask.replace(/9/g, '_').replace(/A/g, '_');
    }

    get displayValue(): string {
        return this.value ?? '';
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const masked = this.applyMask(input.value);
        this.updateValue(masked);
    }

    private applyMask(value: string): string {
        if (!this.mask) return value;

        const mask = this.mask;
        const chars = value.replace(/[^a-zA-Z0-9]/g, '');
        let result = '';
        let charIndex = 0;

        for (let i = 0; i < mask.length && charIndex < chars.length; i++) {
            const maskChar = mask[i];
            if (maskChar === '9') {
                if (/\d/.test(chars[charIndex])) {
                    result += chars[charIndex++];
                } else {
                    break;
                }
            } else if (maskChar === 'A') {
                if (/[a-zA-Z]/.test(chars[charIndex])) {
                    result += chars[charIndex++];
                } else {
                    break;
                }
            } else {
                result += maskChar;
            }
        }

        return result;
    }
}
