import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { BooleanField } from '../../../fields/boolean.field';

@Component({
    selector: 'zg-boolean',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgBooleanComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgBooleanComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-boolean-field" [class]="cssClass()">
            <label class="zg-checkbox-wrapper">
                <input
                    type="checkbox"
                    [id]="field().name"
                    [name]="field().name"
                    [checked]="!!value"
                    [disabled]="disabledStatus"
                    [attr.aria-label]="field().label"
                    [attr.aria-invalid]="showError"
                    class="zg-checkbox"
                    (change)="onChange($event)"
                    (blur)="handleBlur()"
                />
                <span class="zg-checkbox-label">
                    {{ field().label }}
                    <span *ngIf="field().config.required" class="zg-required">*</span>
                </span>
            </label>

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
        .zg-checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        .zg-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .zg-checkbox:disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }
        .zg-checkbox-label {
            font-size: 14px;
            user-select: none;
        }
        .zg-required { color: #ef4444; }
        .zg-hint { color: #6b7280; font-size: 12px; margin-left: 26px; }
        .zg-error { color: #ef4444; font-size: 12px; margin-left: 26px; }
    `],
})
export class ZgBooleanComponent extends BaseNativeComponent<BooleanField, boolean> {
}
