import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { JsonField } from '../../../fields/json.field';

@Component({
    selector: 'zg-json',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgJsonComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgJsonComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-json-field" [class]="wrapperClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <textarea
                    [id]="field().name"
                    [name]="field().name"
                    [value]="jsonString"
                    [placeholder]="field().config.placeholder ?? '{}'"
                    [disabled]="disabledStatus"
                    [readonly]="readonly()"
                    [rows]="6"
                    [attr.tabindex]="tabIndex"
                    [attr.autofocus]="shouldAutofocus ? true : null"
                    [attr.aria-label]="field().label"
                    [attr.aria-invalid]="showError || !isValidJson"
                    [class.zg-invalid]="showError || !isValidJson"
                    class="zg-textarea zg-json-editor"
                    [class]="inputCssClass"
                    (input)="onInput($event)"
                    (blur)="handleBlur()"
            ></textarea>

            <div class="zg-json-toolbar">
                <button
                        type="button"
                        class="zg-json-btn"
                        [disabled]="disabledStatus"
                        (click)="formatJson()"
                >Formatla</button>
                <button
                        type="button"
                        class="zg-json-btn"
                        [disabled]="disabledStatus"
                        (click)="minifyJson()"
                >Küçült</button>
                <span *ngIf="!isValidJson" class="zg-json-invalid">⚠️ Geçersiz JSON</span>
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
        .zg-json-editor {
            font-family: 'Fira Code', 'Monaco', monospace;
            font-size: 13px;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            resize: vertical;
            min-height: 120px;
        }
        .zg-json-editor:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-json-editor.zg-invalid { border-color: #ef4444; }
        .zg-json-editor:disabled { background-color: #f3f4f6; cursor: not-allowed; }
        .zg-json-toolbar {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .zg-json-btn {
            padding: 4px 12px;
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: white;
            cursor: pointer;
        }
        .zg-json-btn:hover { background: #f3f4f6; }
        .zg-json-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-json-invalid { color: #ef4444; font-size: 12px; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgJsonComponent extends BaseNativeComponent<JsonField, Record<string, unknown>> {
    private rawInput = '';
    isValidJson = true;

    get jsonString(): string {
        if (this.rawInput) return this.rawInput;
        try {
            return this.value ? JSON.stringify(this.value, null, 2) : '';
        } catch {
            return '';
        }
    }

    onInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.rawInput = textarea.value;

        try {
            const parsed = JSON.parse(textarea.value);
            this.isValidJson = true;
            this.updateValue(parsed);
        } catch {
            this.isValidJson = false;
        }
    }

    formatJson(): void {
        if (!this.value) return;
        try {
            this.rawInput = JSON.stringify(this.value, null, 2);
        } catch {}
    }

    minifyJson(): void {
        if (!this.value) return;
        try {
            this.rawInput = JSON.stringify(this.value);
        } catch {}
    }
}
