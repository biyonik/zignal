import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { UrlField } from '../../../fields/url.field';

@Component({
    selector: 'zg-url',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgUrlComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgUrlComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-url-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <input
                type="url"
                [id]="field().name"
                [name]="field().name"
                [value]="value ?? ''"
                [placeholder]="field().config.placeholder ?? 'https://'"
                [disabled]="disabledStatus"
                [readonly]="readonly()"
                [attr.aria-label]="field().label"
                [attr.aria-invalid]="showError"
                [class.zg-invalid]="showError"
                class="zg-input"
                autocomplete="url"
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
export class ZgUrlComponent extends BaseNativeComponent<UrlField, string> {
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.updateValue(input.value);
    }
}
