import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { ColorField } from '../../../fields/color.field';

@Component({
    selector: 'zg-color',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgColorComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgColorComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-color-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div class="zg-color-wrapper">
                <input
                    type="color"
                    [id]="field().name"
                    [name]="field().name"
                    [value]="value ?? '#000000'"
                    [disabled]="disabledStatus"
                    class="zg-color-picker"
                    (input)="onColorInput($event)"
                    (blur)="handleBlur()"
                />
                <input
                    type="text"
                    [value]="value ?? ''"
                    [placeholder]="'#RRGGBB'"
                    [disabled]="disabledStatus"
                    [readonly]="readonly()"
                    [class.zg-invalid]="showError"
                    class="zg-input zg-color-text"
                    (input)="onTextInput($event)"
                    (blur)="handleBlur()"
                />
            </div>

            <div *ngIf="presets.length > 0" class="zg-color-presets">
                <button
                    *ngFor="let preset of presets"
                    type="button"
                    class="zg-color-preset"
                    [style.background-color]="preset"
                    [class.selected]="value === preset"
                    [disabled]="disabledStatus"
                    (click)="selectPreset(preset)"
                ></button>
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
        .zg-color-wrapper {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .zg-color-picker {
            width: 48px;
            height: 38px;
            padding: 2px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
        }
        .zg-color-picker:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-color-text {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-family: monospace;
        }
        .zg-color-text:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-color-text.zg-invalid { border-color: #ef4444; }
        .zg-color-presets {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
        }
        .zg-color-preset {
            width: 24px;
            height: 24px;
            border: 2px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.1s;
        }
        .zg-color-preset:hover { transform: scale(1.1); }
        .zg-color-preset.selected { border-color: #3b82f6; }
        .zg-color-preset:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgColorComponent extends BaseNativeComponent<ColorField, string> {
    get presets(): string[] {
        return this.field().config.presets ?? [];
    }

    onColorInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.updateValue(input.value);
    }

    onTextInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.updateValue(input.value);
    }

    selectPreset(color: string): void {
        if (!this.disabledStatus) {
            this.updateValue(color);
        }
    }
}
