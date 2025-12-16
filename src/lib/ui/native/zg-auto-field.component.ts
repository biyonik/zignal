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
 * - StringField → input[type="text" | "email" | "url" | "password"]
 * - NumberField → input[type="number"]
 * - BooleanField → input[type="checkbox"]
 * - SelectField → select
 * - TextareaField → textarea
 *
 * EN: Component that automatically renders the correct input based on field type.
 *
 * Supported types:
 * - StringField → input[type="text" | "email" | "url" | "password"]
 * - NumberField → input[type="number"]
 * - BooleanField → input[type="checkbox"]
 * - SelectField → select
 * - TextareaField → textarea
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

    onBlur(): void {
        this.isTouched.set(true);
        this.onTouched();
    }
}