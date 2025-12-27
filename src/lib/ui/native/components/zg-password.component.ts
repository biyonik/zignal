import {ChangeDetectionStrategy, Component, forwardRef, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { PasswordField } from '../../../fields/password.field';

@Component({
    selector: 'zg-password',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgPasswordComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgPasswordComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-password-field" [class]="wrapperClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div class="zg-password-wrapper">
                <input
                        [type]="showPassword() ? 'text' : 'password'"
                        [id]="field().name"
                        [name]="field().name"
                        [value]="value ?? ''"
                        [placeholder]="field().config.placeholder ?? ''"
                        [disabled]="disabledStatus"
                        [readonly]="readonly()"
                        [attr.minlength]="field().config.minLength"
                        [attr.maxlength]="maxLengthValue ?? field().config.maxLength"
                        [attr.autocomplete]="autocompleteValue ?? 'new-password'"
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
                <button
                        type="button"
                        class="zg-password-toggle"
                        [disabled]="disabledStatus"
                        (click)="togglePassword()"
                        [attr.aria-label]="showPassword() ? 'Şifreyi gizle (Hide Password)' : 'Şifreyi göster (Show Password)'"
                >
                    {{ showPassword() ? '🙈' : '👁️' }}
                </button>
            </div>

            <div *ngIf="field().config.showStrength !== false && value" class="zg-strength">
                <div class="zg-strength-bar">
                    <div
                            class="zg-strength-fill"
                            [style.width.%]="strength"
                            [class.weak]="strength <= 25"
                            [class.fair]="strength > 25 && strength <= 50"
                            [class.good]="strength > 50 && strength <= 75"
                            [class.strong]="strength > 75"
                    ></div>
                </div>
                <span class="zg-strength-text">{{ strengthText }}</span>
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
        .zg-password-wrapper {
            position: relative;
            display: flex;
        }
        .zg-input {
            flex: 1;
            padding: 8px 40px 8px 12px;
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
        .zg-password-toggle {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
        }
        .zg-password-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-strength { margin-top: 4px; }
        .zg-strength-bar {
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
        }
        .zg-strength-fill {
            height: 100%;
            transition: width 0.3s, background-color 0.3s;
        }
        .zg-strength-fill.weak { background-color: #ef4444; }
        .zg-strength-fill.fair { background-color: #f59e0b; }
        .zg-strength-fill.good { background-color: #10b981; }
        .zg-strength-fill.strong { background-color: #059669; }
        .zg-strength-text { font-size: 11px; color: #6b7280; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgPasswordComponent extends BaseNativeComponent<PasswordField, string> {
    showPassword = signal(false);

    get strength(): number {
        const val = this.value ?? '';
        let score = 0;
        if (val.length >= 8) score += 25;
        if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score += 25;
        if (/\d/.test(val)) score += 25;
        if (/[^a-zA-Z0-9]/.test(val)) score += 25;
        return score;
    }

    get strengthText(): string {
        if (this.strength <= 25) return 'Zayıf (Weak)';
        if (this.strength <= 50) return 'Orta (Fair)';
        if (this.strength <= 75) return 'İyi (Good)';
        return 'Güçlü (Strong)';
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.updateValue(input.value);
    }
}
