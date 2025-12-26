import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { TextareaField } from '../../../fields/textarea.field';

@Component({
    selector: 'zg-textarea',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgTextareaComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgTextareaComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-textarea-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <textarea
                [id]="field().name"
                [name]="field().name"
                [value]="value ?? ''"
                [placeholder]="field().config.placeholder ?? ''"
                [disabled]="disabledStatus"
                [readonly]="readonly()"
                [rows]="field().config.rows ?? 4"
                [attr.maxlength]="field().config.maxLength"
                [attr.aria-label]="field().label"
                [attr.aria-invalid]="showError"
                [class.zg-invalid]="showError"
                class="zg-textarea"
                (input)="onInput($event)"
                (blur)="handleBlur()"
            ></textarea>

            <div class="zg-textarea-footer">
                <small *ngIf="field().config.hint && !showError" class="zg-hint">
                    {{ field().config.hint }}
                </small>
                <small *ngIf="field().config.maxLength" class="zg-char-count">
                    {{ charCount }} / {{ field().config.maxLength }}
                </small>
            </div>

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
        .zg-textarea {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            min-height: 80px;
        }
        .zg-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-textarea.zg-invalid { border-color: #ef4444; }
        .zg-textarea:disabled { background-color: #f3f4f6; cursor: not-allowed; }
        .zg-textarea-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-char-count { color: #9ca3af; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgTextareaComponent extends BaseNativeComponent<TextareaField, string> {
    get charCount(): number {
        return this.value?.length ?? 0;
    }

    onInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.updateValue(textarea.value);
    }
}
