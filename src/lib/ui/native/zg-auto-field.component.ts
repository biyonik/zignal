import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
    Validator,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { IField } from '../../core/interfaces';
import { StringField, StringFieldConfig } from '../../fields/string.field';
import { NumberField, NumberFieldConfig } from '../../fields/number.field';
import { BooleanField } from '../../fields/boolean.field';
import { SelectField, SelectFieldConfig, SelectOption } from '../../fields/select.field';
import { TextareaField, TextareaFieldConfig } from '../../fields/textarea.field';
import { PasswordField, PasswordFieldConfig } from '../../fields/password.field';
import { EmailField } from '../../fields/email.field';
import { UrlField } from '../../fields/url.field';
import { PhoneField, PhoneFieldConfig } from '../../fields/phone.field';
import { ColorField, ColorFieldConfig } from '../../fields/color.field';

/**
 * @fileoverview
 * TR: Field tipine göre otomatik UI render eden bileşen.
 * Vanilla HTML elementleri kullanır, herhangi bir UI framework gerektirmez.
 * Signal-first yaklaşım ile reaktif state yönetimi.
 *
 * EN: Component that automatically renders UI based on field type.
 * Uses vanilla HTML elements, doesn't require any UI framework.
 * Signal-first approach for reactive state management.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Field tipine göre otomatik olarak doğru input'u render eden bileşen.
 *
 * Desteklenen tipler:
 * - StringField → input[type="text"]
 * - PasswordField → input[type="password"]
 * - EmailField → input[type="email"]
 * - UrlField → input[type="url"]
 * - PhoneField → input[type="tel"]
 * - NumberField → input[type="number"]
 * - BooleanField → input[type="checkbox"]
 * - SelectField → select
 * - TextareaField → textarea
 * - ColorField → input[type="color"]
 *
 * EN: Component that automatically renders the correct input based on field type.
 *
 * @example
 * ```html
 * <zg-auto-field
 *   [field]="emailField"
 *   formControlName="email"
 *   [showLabel]="true"
 *   [showErrors]="true"
 * />
 * ```
 */
@Component({
    selector: 'zg-auto-field',
    standalone: true,
    imports: [],
    template: `
        @if (showLabel() && field()) {
            <label [for]="field().name" class="zg-label">
                {{ field().label }}
                @if (field().config.required) {
                    <span class="zg-required">*</span>
                }
            </label>
        }

        @switch (fieldType()) {
            @case ('string') {
                <input
                    [id]="field().name"
                    [type]="stringInputType()"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? ''"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                />
            }

            @case ('password') {
                <input
                    [id]="field().name"
                    type="password"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? ''"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    [attr.minlength]="passwordConfig()?.minLength"
                    [attr.maxlength]="passwordConfig()?.maxLength"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                    autocomplete="new-password"
                />
                @if (passwordConfig()?.showStrength !== false && value()) {
                    <div class="zg-password-strength">
                        <div class="zg-password-strength-bar"
                             [style.width.%]="passwordStrength()"
                             [class.zg-strength-weak]="passwordStrength() <= 25"
                             [class.zg-strength-fair]="passwordStrength() > 25 && passwordStrength() <= 50"
                             [class.zg-strength-good]="passwordStrength() > 50 && passwordStrength() <= 75"
                             [class.zg-strength-strong]="passwordStrength() > 75">
                        </div>
                    </div>
                }
            }

            @case ('email') {
                <input
                    [id]="field().name"
                    type="email"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? 'ornek@email.com'"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                    autocomplete="email"
                />
            }

            @case ('url') {
                <input
                    [id]="field().name"
                    type="url"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? 'https://'"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                    autocomplete="url"
                />
            }

            @case ('phone') {
                <input
                    [id]="field().name"
                    type="tel"
                    [value]="value() ?? ''"
                    [placeholder]="phoneConfig()?.placeholder ?? phonePlaceholder()"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                    autocomplete="tel"
                />
            }

            @case ('color') {
                <div class="zg-color-field">
                    <input
                        [id]="field().name"
                        type="color"
                        [value]="value() ?? '#000000'"
                        [disabled]="isDisabled()"
                        (input)="onColorInput($event)"
                        (blur)="onBlur()"
                        class="zg-color-input"
                    />
                    <input
                        type="text"
                        [value]="value() ?? ''"
                        [placeholder]="'#RRGGBB'"
                        [disabled]="isDisabled()"
                        (input)="onInput($event)"
                        (blur)="onBlur()"
                        class="zg-input zg-color-text"
                        [class.zg-input--error]="hasError()"
                    />
                    @if (colorConfig()?.presets?.length) {
                        <div class="zg-color-presets">
                            @for (preset of colorConfig()?.presets; track preset) {
                                <button
                                    type="button"
                                    class="zg-color-preset"
                                    [style.background-color]="preset"
                                    [class.zg-color-preset--selected]="value() === preset"
                                    (click)="onColorPresetClick(preset)"
                                    [disabled]="isDisabled()">
                                </button>
                            }
                        </div>
                    }
                </div>
            }

            @case ('number') {
                <input
                    [id]="field().name"
                    type="number"
                    [value]="value()"
                    [placeholder]="field().config.placeholder ?? ''"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    [min]="numberConfig()?.min"
                    [max]="numberConfig()?.max"
                    [step]="numberConfig()?.integer ? 1 : 'any'"
                    (input)="onNumberInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                />
            }

            @case ('boolean') {
                <label class="zg-checkbox">
                    <input
                        [id]="field().name"
                        type="checkbox"
                        [checked]="!!value()"
                        [disabled]="isDisabled()"
                        (change)="onCheckboxChange($event)"
                        (blur)="onBlur()"
                    />
                    <span class="zg-checkbox-label">{{ field().label }}</span>
                </label>
            }

            @case ('select') {
                <select
                    [id]="field().name"
                    [value]="value()"
                    [disabled]="isDisabled()"
                    [required]="field().config.required ?? false"
                    (change)="onSelectChange($event)"
                    (blur)="onBlur()"
                    class="zg-select"
                    [class.zg-select--error]="hasError()"
                >
                    @if (selectConfig()?.clearable) {
                        <option value="">{{ selectConfig()?.placeholder ?? 'Seçiniz...' }}</option>
                    }
                    @for (option of selectOptions(); track option.value) {
                        <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option>
                    }
                </select>
            }

            @case ('textarea') {
                <textarea
                    [id]="field().name"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? ''"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    [rows]="textareaConfig()?.rows ?? 3"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-textarea"
                    [class.zg-textarea--error]="hasError()"
                ></textarea>
            }

            @default {
                <input
                    [id]="field().name"
                    type="text"
                    [value]="value() ?? ''"
                    [placeholder]="field().config.placeholder ?? ''"
                    [disabled]="isDisabled()"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                />
            }
        }

        @if (showHint() && field().config.hint && !hasError()) {
            <div class="zg-hint">{{ field().config.hint }}</div>
        }

        @if (showErrors() && hasError() && errorMessage()) {
            <div class="zg-error" role="alert">{{ errorMessage() }}</div>
        }
    `,
    styles: [`
        :host { display: block; margin-bottom: 1rem; }
        .zg-label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.875rem; }
        .zg-required { color: #dc2626; margin-left: 0.125rem; }
        .zg-input, .zg-select, .zg-textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 1rem;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .zg-input:focus, .zg-select:focus, .zg-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-input--error, .zg-select--error, .zg-textarea--error { border-color: #dc2626; }
        .zg-input:disabled, .zg-select:disabled, .zg-textarea:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
        }
        .zg-checkbox { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .zg-checkbox input { width: 1rem; height: 1rem; }
        .zg-hint { color: #6b7280; font-size: 0.75rem; margin-top: 0.25rem; }
        .zg-error { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }

        /* Password strength indicator */
        .zg-password-strength {
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            margin-top: 0.25rem;
            overflow: hidden;
        }
        .zg-password-strength-bar {
            height: 100%;
            transition: width 0.3s, background-color 0.3s;
        }
        .zg-strength-weak { background-color: #dc2626; }
        .zg-strength-fair { background-color: #f59e0b; }
        .zg-strength-good { background-color: #10b981; }
        .zg-strength-strong { background-color: #059669; }

        /* Color field */
        .zg-color-field { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
        .zg-color-input {
            width: 3rem;
            height: 2.5rem;
            padding: 0.25rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            cursor: pointer;
        }
        .zg-color-text { flex: 1; min-width: 100px; }
        .zg-color-presets { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .zg-color-preset {
            width: 1.5rem;
            height: 1.5rem;
            border: 2px solid transparent;
            border-radius: 0.25rem;
            cursor: pointer;
            padding: 0;
        }
        .zg-color-preset:hover { border-color: #9ca3af; }
        .zg-color-preset--selected { border-color: #3b82f6; }
        .zg-color-preset:disabled { opacity: 0.5; cursor: not-allowed; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZgAutoFieldComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => ZgAutoFieldComponent), multi: true },
    ],
})
export class ZgAutoFieldComponent<T = unknown>
    implements ControlValueAccessor, Validator {

    readonly field = input.required<IField<T>>();
    readonly showLabel = input(true);
    readonly showHint = input(true);
    readonly showErrors = input(true);

    readonly value = signal<T | null>(null);
    readonly isDisabled = signal(false);
    readonly isTouched = signal(false);

    readonly fieldType = computed(() => {
        const f = this.field();
        if (f instanceof PasswordField) return 'password';
        if (f instanceof EmailField) return 'email';
        if (f instanceof UrlField) return 'url';
        if (f instanceof PhoneField) return 'phone';
        if (f instanceof ColorField) return 'color';
        if (f instanceof StringField) return 'string';
        if (f instanceof NumberField) return 'number';
        if (f instanceof BooleanField) return 'boolean';
        if (f instanceof SelectField) return 'select';
        if (f instanceof TextareaField) return 'textarea';
        return 'unknown';
    });

    readonly stringInputType = computed(() => {
        const config = this.field().config as StringFieldConfig;
        if (config.email) return 'email';
        if (config.url) return 'url';
        return 'text';
    });

    readonly numberConfig = computed((): NumberFieldConfig | null =>
        this.field() instanceof NumberField ? this.field().config : null,
    );

    readonly passwordConfig = computed((): PasswordFieldConfig | null => {
        const f = this.field();
        return f instanceof PasswordField ? (f as unknown as PasswordField).config : null;
    });

    readonly phoneConfig = computed((): PhoneFieldConfig | null => {
        const f = this.field();
        return f instanceof PhoneField ? (f as unknown as PhoneField).config : null;
    });

    readonly colorConfig = computed((): ColorFieldConfig | null => {
        const f = this.field();
        return f instanceof ColorField ? (f as unknown as ColorField).config : null;
    });

    readonly selectConfig = computed((): SelectFieldConfig<T> | null => {
        const f = this.field();
        if (f instanceof SelectField) {
            return f.config;
        }
        return null;
    });

    readonly selectOptions = computed((): SelectOption<T>[] => {
        const f = this.field();
        if (f instanceof SelectField) {
            return f.config.options ?? [];
        }
        return [];
    });

    readonly textareaConfig = computed((): TextareaFieldConfig | null =>
        this.field() instanceof TextareaField ? this.field().config : null,
    );

    readonly passwordStrength = computed((): number => {
        const f = this.field();
        if (f instanceof PasswordField) {
            return f.getStrengthPercentage(this.value() as string | null);
        }
        return 0;
    });

    readonly phonePlaceholder = computed((): string => {
        const f = this.field();
        if (f instanceof PhoneField) {
            return f.getExample();
        }
        return '';
    });

    private readonly validationResult = computed(() =>
        this.field().schema().safeParse(this.value()),
    );

    readonly hasError = computed(() =>
        this.isTouched() && !this.validationResult().success,
    );

    readonly errorMessage = computed((): string | null => {
        if (!this.hasError()) return null;
        const result = this.validationResult();
        return result.success
            ? null
            : result.error.errors[0]?.message ?? 'Geçersiz değer';
    });

    private onChange: (value: T | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(val: T | null): void {
        this.value.set(val);
    }

    registerOnChange(fn: (value: T | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.isDisabled.set(disabled);
    }

    validate(control: AbstractControl): ValidationErrors | null {
        const result = this.field().schema().safeParse(control.value);
        if (result.success) return null;
        const errors: ValidationErrors = {};
        for (const error of result.error.errors) {
            errors[error.code || 'zodError'] = { message: error.message };
        }
        return errors;
    }

    onInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value as T;
        this.value.set(value);
        this.onChange(value);
    }

    onNumberInput(event: Event): void {
        const num = (event.target as HTMLInputElement).valueAsNumber;
        const value = (isNaN(num) ? null : num) as T;
        this.value.set(value);
        this.onChange(value);
    }

    onCheckboxChange(event: Event): void {
        const value = (event.target as HTMLInputElement).checked as T;
        this.value.set(value);
        this.onChange(value);
    }

    onSelectChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value as T;
        this.value.set(value);
        this.onChange(value);
    }

    onColorInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value as T;
        this.value.set(value);
        this.onChange(value);
    }

    onColorPresetClick(preset: string): void {
        const value = preset as T;
        this.value.set(value);
        this.onChange(value);
    }

    onBlur(): void {
        this.isTouched.set(true);
        this.onTouched();
    }
}
