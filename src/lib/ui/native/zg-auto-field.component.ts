import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input
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
import { MultiselectField, MultiselectFieldConfig } from '../../fields/multiselect.field';
import { TextareaField, TextareaFieldConfig } from '../../fields/textarea.field';
import { PasswordField, PasswordFieldConfig } from '../../fields/password.field';
import { EmailField } from '../../fields/email.field';
import { UrlField } from '../../fields/url.field';
import { PhoneField, PhoneFieldConfig } from '../../fields/phone.field';
import { ColorField, ColorFieldConfig } from '../../fields/color.field';
import { DateField, DateFieldConfig } from '../../fields/date.field';
import { FileField, FileFieldConfig, FileInfo } from '../../fields/file.field';
import {
    JsonField,
    MaskedField,
    MoneyField,
    PercentField,
    RatingField,
    SlugField,
    TagsField,
    TimeField
} from "../../fields";
import {ZgRatingComponent, ZgTagsComponent} from "./components";

export interface FieldComponent {
    field: any;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
}

// export const FIELD_COMPONENTS: Record<string, () => Promise<Type<FieldComponent>> = {
//     // 'string': () => import('./components/zg-string.component').then(m => m.ZgStringComponent),
//     // 'number': () => import('./number-field.component').then(m => m.NumberFieldComponent),
//     // 'date': () => import('./date-field.component').then(m => m.DateFieldComponent),
//     // 'select': () => import('./select-field.component').then(m => m.SelectFieldComponent),
//     // 'file': () => import('./file-field.component').then(m => m.FileFieldComponent),
//     // 'boolean': () => import('./boolean-field.component').then(m => m.BooleanFieldComponent),
//     // 'password': () => import('./password-field.component').then(m => m.PasswordFieldComponent),
//     // 'textarea': () => import('./textarea-field.component').then(m => m.TextareaFieldComponent),
//     // 'array': () => import('./array-field.component').then(m => m.ArrayFieldComponent),
//     // 'group': () => import('./group-field.component').then(m => m.GroupFieldComponent),
// };

/**
 * @fileoverview
 * TR: Field tipine göre otomatik UI render eden bileşen.
 * EN: Component that automatically renders UI based on field type.
 */
@Component({
    selector: 'zg-auto-field',
    standalone: true,
    imports: [
        ZgTagsComponent,
        ZgRatingComponent
    ],
    template: `
        @if (showLabel() && field() && fieldType() !== 'boolean') {
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
                <div class="zg-password-wrapper">
                    <input
                        [id]="field().name"
                        [type]="showPassword() ? 'text' : 'password'"
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
                    <button 
                        type="button" 
                        class="zg-password-toggle"
                        (click)="togglePassword()"
                        [disabled]="isDisabled()">
                        {{ showPassword() ? '🙈' : '👁️' }}
                    </button>
                </div>
                @if (passwordConfig()?.showStrength !== false && value()) {
                    <div class="zg-password-strength">
                        <div class="zg-password-strength-bar"
                             [style.width.%]="passwordStrength()"
                             [class.zg-strength-weak]="passwordStrength() <= 25"
                             [class.zg-strength-fair]="passwordStrength() > 25 && passwordStrength() <= 50"
                             [class.zg-strength-good]="passwordStrength() > 50 && passwordStrength() <= 75"
                             [class.zg-strength-strong]="passwordStrength() > 75">
                        </div>
                        <span class="zg-strength-text">{{ passwordStrengthText() }}</span>
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
                    @if (field().config.required) {
                        <span class="zg-required">*</span>
                    }
                </label>
            }

            @case ('date') {
                <input
                    [id]="field().name"
                    type="date"
                    [value]="dateValue()"
                    [min]="dateMin()"
                    [max]="dateMax()"
                    [disabled]="isDisabled()"
                    [readonly]="field().config.readonly ?? false"
                    [required]="field().config.required ?? false"
                    (input)="onDateInput($event)"
                    (blur)="onBlur()"
                    class="zg-input"
                    [class.zg-input--error]="hasError()"
                />
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
                    @if (selectConfig()?.clearable !== false) {
                        <option value="">{{ selectConfig()?.placeholder ?? 'Seçiniz...' }}</option>
                    }
                    @for (option of selectOptions(); track option.value) {
                        @if (option.group) {
                            <!-- Grouped options handled separately -->
                        } @else {
                            <option [value]="option.value" [disabled]="option.disabled">
                                {{ option.label }}
                            </option>
                        }
                    }
                </select>
            }

            @case ('multiselect') {
                <div class="zg-multiselect" [class.zg-multiselect--error]="hasError()">
                    <div class="zg-multiselect-selected">
                        @for (val of multiselectValue(); track val) {
                            <span class="zg-multiselect-chip">
                                {{ getOptionLabel(val) }}
                                <button type="button" 
                                        class="zg-multiselect-chip-remove"
                                        (click)="removeMultiselectValue(val)"
                                        [disabled]="isDisabled()">×</button>
                            </span>
                        }
                    </div>
                    <select
                        [id]="field().name"
                        [disabled]="isDisabled() || isMaxSelected()"
                        (change)="onMultiselectAdd($event)"
                        (blur)="onBlur()"
                        class="zg-select"
                    >
                        <option value="">{{ multiselectPlaceholder() }}</option>
                        @for (option of availableMultiselectOptions(); track option.value) {
                            <option [value]="option.value" [disabled]="option.disabled">
                                {{ option.label }}
                            </option>
                        }
                    </select>
                    @if (multiselectConfig()?.showSelectAll && availableMultiselectOptions().length > 0) {
                        <button type="button" 
                                class="zg-multiselect-select-all"
                                (click)="selectAllMultiselect()"
                                [disabled]="isDisabled()">
                            Tümünü Seç
                        </button>
                    }
                </div>
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
                    [attr.maxlength]="textareaConfig()?.maxLength"
                    (input)="onInput($event)"
                    (blur)="onBlur()"
                    class="zg-textarea"
                    [class.zg-textarea--error]="hasError()"
                ></textarea>
                @if (textareaConfig()?.maxLength) {
                    <div class="zg-char-count">
                        {{ textareaCharCount() }} / {{ textareaConfig()?.maxLength }}
                    </div>
                }
            }

            @case ('file') {
                <div class="zg-file-field" [class.zg-file-field--error]="hasError()">
                    <input
                        #fileInput
                        [id]="field().name"
                        type="file"
                        [accept]="fileAccept()"
                        [multiple]="fileConfig()?.multiple ?? false"
                        [disabled]="isDisabled()"
                        (change)="onFileChange($event)"
                        class="zg-file-input"
                    />
                    <label [for]="field().name" class="zg-file-label">
                        <span class="zg-file-icon">📁</span>
                        <span class="zg-file-text">
                            {{ fileConfig()?.multiple ? 'Dosyaları seçin veya sürükleyin' : 'Dosya seçin veya sürükleyin' }}
                        </span>
                    </label>
                    
                    @if (fileValue()) {
                        <div class="zg-file-preview">
                            @if (isFileArray()) {
                                @for (file of fileValueArray(); track file.name) {
                                    <div class="zg-file-item">
                                        @if (isImageFile(file)) {
                                            <img [src]="file.preview" [alt]="file.name" class="zg-file-thumb" />
                                        } @else {
                                            <span class="zg-file-icon-small">{{ getFileIcon(file) }}</span>
                                        }
                                        <span class="zg-file-name">{{ file.name }}</span>
                                        <span class="zg-file-size">{{ formatFileSize(file.size) }}</span>
                                        <button type="button" 
                                                class="zg-file-remove"
                                                (click)="removeFile(file)"
                                                [disabled]="isDisabled()">×</button>
                                    </div>
                                }
                            } @else {
                                <div class="zg-file-item">
                                    @if (isImageFile(fileValueSingle()!)) {
                                        <img [src]="fileValueSingle()!.preview" [alt]="fileValueSingle()!.name" class="zg-file-thumb" />
                                    } @else {
                                        <span class="zg-file-icon-small">{{ getFileIcon(fileValueSingle()!) }}</span>
                                    }
                                    <span class="zg-file-name">{{ fileValueSingle()!.name }}</span>
                                    <span class="zg-file-size">{{ formatFileSize(fileValueSingle()!.size) }}</span>
                                    <button type="button" 
                                            class="zg-file-remove"
                                            (click)="clearFile()"
                                            [disabled]="isDisabled()">×</button>
                                </div>
                            }
                        </div>
                    }
                </div>
            }

            @case ('masked') {
                <input
                        [id]="field().name"
                        type="text"
                        [value]="value() ?? ''"
                        [placeholder]="field().config.placeholder ?? ''"
                        [disabled]="isDisabled()"
                        [readonly]="field().config.readonly ?? false"
                        class="zg-input"
                        [class.zg-input--error]="hasError()"
                        (input)="onInput($event)"
                        (blur)="onBlur()"
                />
            }

            @case ('money') {
                <div class="zg-money-wrapper">
                    <span class="zg-money-symbol">{{ getCurrencySymbol() }}</span>
                    <input
                            [id]="field().name"
                            type="number"
                            [value]="value()"
                            [placeholder]="field().config.placeholder ?? '0.00'"
                            [disabled]="isDisabled()"
                            [step]="getMoneyStep()"
                            class="zg-input"
                            [class.zg-input--error]="hasError()"
                            (input)="onNumberInput($event)"
                            (blur)="onBlur()"
                    />
                </div>
            }

            @case ('percent') {
                <div class="zg-percent-wrapper">
                    <input
                            [id]="field().name"
                            type="number"
                            [value]="value()"
                            [min]="0"
                            [max]="100"
                            [step]="1"
                            [disabled]="isDisabled()"
                            class="zg-input"
                            [class.zg-input--error]="hasError()"
                            (input)="onNumberInput($event)"
                            (blur)="onBlur()"
                    />
                    <span class="zg-percent-symbol">%</span>
                </div>
            }

            @case ('slug') {
                <input
                        [id]="field().name"
                        type="text"
                        [value]="value() ?? ''"
                        [placeholder]="'ornek-slug'"
                        [disabled]="isDisabled()"
                        class="zg-input zg-slug-input"
                        [class.zg-input--error]="hasError()"
                        (input)="onSlugInput($event)"
                        (blur)="onBlur()"
                />
            }

            @case ('time') {
                <input
                        [id]="field().name"
                        type="time"
                        [value]="value() ?? ''"
                        [disabled]="isDisabled()"
                        class="zg-input"
                        [class.zg-input--error]="hasError()"
                        (input)="onInput($event)"
                        (blur)="onBlur()"
                />
            }

            @case ('json') {
                <textarea
                        [id]="field().name"
                        [value]="jsonValue()"
                        [placeholder]="'{}'"
                        [disabled]="isDisabled()"
                        [rows]="6"
                        class="zg-textarea zg-json-editor"
                        [class.zg-textarea--error]="hasError()"
                        (input)="onJsonInput($event)"
                        (blur)="onBlur()"
                ></textarea>
            }

            @case ('tags') {
                <zg-tags [field]="tagsField()!" (valueChange)="onTagsChange($event)"></zg-tags>
            }

            @case ('rating') {
                <zg-rating [field]="ratingField()!" (valueChange)="onRatingChange($event)"></zg-rating>
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
        
        /* Labels */
        .zg-label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.875rem; }
        .zg-required { color: #dc2626; margin-left: 0.125rem; }
        
        /* Inputs */
        .zg-input, .zg-select, .zg-textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 1rem;
            transition: border-color 0.15s, box-shadow 0.15s;
            background-color: white;
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
        
        /* Checkbox */
        .zg-checkbox { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .zg-checkbox input { width: 1rem; height: 1rem; cursor: pointer; }
        
        /* Hint & Error */
        .zg-hint { color: #6b7280; font-size: 0.75rem; margin-top: 0.25rem; }
        .zg-error { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }
        .zg-char-count { color: #6b7280; font-size: 0.75rem; text-align: right; margin-top: 0.25rem; }

        /* Password */
        .zg-password-wrapper { position: relative; display: flex; }
        .zg-password-wrapper .zg-input { padding-right: 2.5rem; }
        .zg-password-toggle {
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 0.25rem;
        }
        .zg-password-strength {
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            margin-top: 0.5rem;
            overflow: hidden;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .zg-password-strength-bar {
            height: 100%;
            transition: width 0.3s, background-color 0.3s;
            flex-shrink: 0;
        }
        .zg-strength-weak { background-color: #dc2626; }
        .zg-strength-fair { background-color: #f59e0b; }
        .zg-strength-good { background-color: #10b981; }
        .zg-strength-strong { background-color: #059669; }
        .zg-strength-text { font-size: 0.7rem; color: #6b7280; white-space: nowrap; }

        /* Color */
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

        /* Multiselect */
        .zg-multiselect { display: flex; flex-direction: column; gap: 0.5rem; }
        .zg-multiselect-selected { display: flex; flex-wrap: wrap; gap: 0.25rem; min-height: 1.5rem; }
        .zg-multiselect-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.125rem 0.5rem;
            background-color: #e5e7eb;
            border-radius: 9999px;
            font-size: 0.875rem;
        }
        .zg-multiselect-chip-remove {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            line-height: 1;
            color: #6b7280;
            padding: 0;
        }
        .zg-multiselect-chip-remove:hover { color: #dc2626; }
        .zg-multiselect-select-all {
            align-self: flex-start;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 0.25rem;
            cursor: pointer;
        }
        .zg-multiselect--error .zg-select { border-color: #dc2626; }

        /* File */
        .zg-file-field { }
        .zg-file-input { 
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }
        .zg-file-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            border: 2px dashed #d1d5db;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: border-color 0.15s, background-color 0.15s;
        }
        .zg-file-label:hover {
            border-color: #3b82f6;
            background-color: #f0f9ff;
        }
        .zg-file-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .zg-file-text { color: #6b7280; font-size: 0.875rem; }
        .zg-file-preview { margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .zg-file-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background-color: #f9fafb;
            border-radius: 0.375rem;
        }
        .zg-file-thumb { width: 2.5rem; height: 2.5rem; object-fit: cover; border-radius: 0.25rem; }
        .zg-file-icon-small { font-size: 1.5rem; }
        .zg-file-name { flex: 1; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .zg-file-size { font-size: 0.75rem; color: #6b7280; }
        .zg-file-remove {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.25rem;
            color: #6b7280;
            padding: 0.25rem;
        }
        .zg-file-remove:hover { color: #dc2626; }
        .zg-file-field--error .zg-file-label { border-color: #dc2626; }
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
    readonly showPassword = signal(false);

    readonly textareaCharCount = computed((): number => {
        const val = this.value();
        if (typeof val === 'string') {
            return val.length;
        }
        return 0;
    });

    readonly tagsField = computed((): TagsField | null => {
        const f = this.field();
        return f instanceof TagsField ? f : null;
    });

    readonly ratingField = computed((): RatingField | null => {
        const f = this.field();
        return f instanceof RatingField ? f : null;
    });

    readonly fieldType = computed(() => {
        const f = this.field();
        if (f instanceof PasswordField) return 'password';
        if (f instanceof EmailField) return 'email';
        if (f instanceof UrlField) return 'url';
        if (f instanceof PhoneField) return 'phone';
        if (f instanceof ColorField) return 'color';
        if (f instanceof DateField) return 'date';
        if (f instanceof FileField) return 'file';
        if (f instanceof MultiselectField) return 'multiselect';
        if (f instanceof StringField) return 'string';
        if (f instanceof NumberField) return 'number';
        if (f instanceof BooleanField) return 'boolean';
        if (f instanceof SelectField) return 'select';
        if (f instanceof TextareaField) return 'textarea';
        if (f instanceof MaskedField) return 'masked';
        if (f instanceof MoneyField) return 'money';
        if (f instanceof PercentField) return 'percent';
        if (f instanceof SlugField) return 'slug';
        if (f instanceof TimeField) return 'time';
        if (f instanceof JsonField) return 'json';
        if (f instanceof TagsField) return 'tags';
        if (f instanceof RatingField) return 'rating';

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
        return f instanceof PasswordField ? (f as PasswordField).config : null;
    });

    readonly phoneConfig = computed((): PhoneFieldConfig | null => {
        const f = this.field();
        return f instanceof PhoneField ? (f as PhoneField).config : null;
    });

    readonly colorConfig = computed((): ColorFieldConfig | null => {
        const f = this.field();
        return f instanceof ColorField ? (f as ColorField).config : null;
    });

    readonly selectConfig = computed((): SelectFieldConfig<T> | null => {
        const f = this.field();
        if (f instanceof SelectField) {
            return f.config as SelectFieldConfig<T>;
        }
        return null;
    });

    readonly selectOptions = computed((): SelectOption<T>[] => {
        const f = this.field();
        if (f instanceof SelectField) {
            return (f.config as SelectFieldConfig<T>).options ?? [];
        }
        return [];
    });

    readonly textareaConfig = computed((): TextareaFieldConfig | null =>
        this.field() instanceof TextareaField ? this.field().config : null,
    );

    readonly multiselectConfig = computed((): MultiselectFieldConfig<unknown> | null => {
        const f = this.field();
        return f instanceof MultiselectField ? f.config : null;
    });

    readonly fileConfig = computed((): FileFieldConfig | null => {
        const f = this.field();
        return f instanceof FileField ? f.config : null;
    });

    readonly dateConfig = computed((): DateFieldConfig | null => {
        const f = this.field();
        return f instanceof DateField ? f.config : null;
    });

    readonly passwordStrength = computed((): number => {
        const f = this.field();
        if (f instanceof PasswordField) {
            return f.getStrengthPercentage(this.value() as string | null);
        }
        return 0;
    });

    readonly passwordStrengthText = computed((): string => {
        const strength = this.passwordStrength();
        if (strength <= 25) return 'Zayıf';
        if (strength <= 50) return 'Orta';
        if (strength <= 75) return 'İyi';
        return 'Güçlü';
    });

    readonly phonePlaceholder = computed((): string => {
        const f = this.field();
        if (f instanceof PhoneField) {
            return f.getExample();
        }
        return '';
    });

    // Date helpers
    readonly dateValue = computed((): string => {
        const val = this.value();
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        return '';
    });

    readonly dateMin = computed((): string | null => {
        const config = this.dateConfig();
        if (config?.minToday) {
            return new Date().toISOString().split('T')[0];
        }
        if (config?.min) {
            return config.min.toISOString().split('T')[0];
        }
        return null;
    });

    readonly dateMax = computed((): string | null => {
        const config = this.dateConfig();
        if (config?.maxToday) {
            return new Date().toISOString().split('T')[0];
        }
        if (config?.max) {
            return config.max.toISOString().split('T')[0];
        }
        return null;
    });

    // Multiselect helpers
    readonly multiselectValue = computed((): unknown[] => {
        const val = this.value();
        return Array.isArray(val) ? val : [];
    });

    readonly availableMultiselectOptions = computed(() => {
        const config = this.multiselectConfig();
        if (!config) return [];
        const selected = this.multiselectValue();
        return config.options.filter(opt => !selected.includes(opt.value) && !opt.disabled);
    });

    readonly isMaxSelected = computed((): boolean => {
        const config = this.multiselectConfig();
        if (!config?.maxSelections) return false;
        return this.multiselectValue().length >= config.maxSelections;
    });

    readonly multiselectPlaceholder = computed((): string => {
        if (this.isMaxSelected()) return 'Maksimum seçim sayısına ulaşıldı';
        return 'Seçim ekle...';
    });

    // File helpers
    readonly fileAccept = computed((): string => {
        const f = this.field();
        if (f instanceof FileField) {
            return f.getAcceptAttribute();
        }
        return '';
    });

    readonly fileValue = computed((): FileInfo | FileInfo[] | null => {
        return this.value() as FileInfo | FileInfo[] | null;
    });

    readonly isFileArray = computed((): boolean => {
        return Array.isArray(this.fileValue());
    });

    readonly fileValueArray = computed((): FileInfo[] => {
        const val = this.fileValue();
        return Array.isArray(val) ? val : [];
    });

    readonly fileValueSingle = computed((): FileInfo | null => {
        const val = this.fileValue();
        return Array.isArray(val) ? null : val;
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
            : result.error?.issues?.[0]?.message ?? 'Geçersiz değer';
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
        const zodIssues = result.error?.issues ?? [];

        for (const issue of zodIssues) {
            errors[issue.code || 'zodError'] = {
                message: issue.message,
                path: issue.path,
            };
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
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
        const rawValue = (event.target as HTMLSelectElement).value;
        // Handle empty string for clearable selects
        const value = rawValue === '' ? null : rawValue as T;
        this.value.set(value);
        this.onChange(value);
    }

    onDateInput(event: Event): void {
        const dateStr = (event.target as HTMLInputElement).value;
        if (!dateStr) {
            this.value.set(null);
            this.onChange(null);
            return;
        }
        const date = new Date(dateStr) as T;
        this.value.set(date);
        this.onChange(date);
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

    // Multiselect methods
    getOptionLabel(value: unknown): string {
        const config = this.multiselectConfig();
        if (!config) return String(value);
        const option = config.options.find(opt => opt.value === value);
        return option?.label ?? String(value);
    }

    onMultiselectAdd(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newValue = select.value;
        if (!newValue) return;

        const current = this.multiselectValue();
        // Type coercion based on existing values or config
        const config = this.multiselectConfig();
        const option = config?.options.find(opt => String(opt.value) === newValue);
        const typedValue = option?.value ?? newValue;

        if (!current.includes(typedValue)) {
            const updated = [...current, typedValue] as T;
            this.value.set(updated);
            this.onChange(updated);
        }
        select.value = ''; // Reset select
    }

    removeMultiselectValue(valueToRemove: unknown): void {
        const current = this.multiselectValue();
        const updated = current.filter(v => v !== valueToRemove) as T;
        this.value.set(updated);
        this.onChange(updated);
    }

    selectAllMultiselect(): void {
        const config = this.multiselectConfig();
        if (!config) return;
        const allValues = config.options
            .filter(opt => !opt.disabled)
            .map(opt => opt.value);

        // Respect max if set
        const max = config.maxSelections;
        const limited = max ? allValues.slice(0, max) : allValues;

        this.value.set(limited as T);
        this.onChange(limited as T);
    }

    // File methods
    async onFileChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const f = this.field();
        if (!(f instanceof FileField)) return;

        const config = this.fileConfig();
        const fileInfos: FileInfo[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const preview = await this.createFilePreview(file);
            fileInfos.push(f.createFileInfo(file, preview ?? undefined));
        }

        if (config?.multiple) {
            const current = this.fileValueArray();
            const updated = [...current, ...fileInfos] as T;
            this.value.set(updated);
            this.onChange(updated);
        } else {
            const value = fileInfos[0] as T;
            this.value.set(value);
            this.onChange(value);
        }

        // Reset input
        input.value = '';
    }

    private createFilePreview(file: File): Promise<string | null> {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    removeFile(fileToRemove: FileInfo): void {
        const current = this.fileValueArray();
        const updated = current.filter(f => f.name !== fileToRemove.name) as T;
        this.value.set(updated);
        this.onChange(updated);
    }

    clearFile(): void {
        this.value.set(null);
        this.onChange(null);
    }

    isImageFile(file: FileInfo): boolean {
        return file.type.startsWith('image/');
    }

    getFileIcon(file: FileInfo): string {
        const f = this.field();
        if (f instanceof FileField) {
            const iconName = f.getFileIcon(file);
            const icons: Record<string, string> = {
                image: '🖼️',
                video: '🎬',
                audio: '🎵',
                pdf: '📄',
                document: '📝',
                spreadsheet: '📊',
                archive: '📦',
                file: '📁'
            };
            return icons[iconName] ?? '📁';
        }
        return '📁';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getCurrencySymbol(): string {
        const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
        const config = this.field().config as any;
        return symbols[config?.currency ?? 'TRY'] ?? '₺';
    }

    getMoneyStep(): string {
        const config = this.field().config as any;
        const decimals = config?.decimals ?? 2;
        return (1 / Math.pow(10, decimals)).toString();
    }

    onSlugInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const slugified = input.value
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        this.value.set(slugified as T);
        this.onChange(slugified as T);
    }

    jsonValue(): string {
        try {
            return this.value() ? JSON.stringify(this.value(), null, 2) : '';
        } catch {
            return '';
        }
    }

    onJsonInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        try {
            const parsed = JSON.parse(textarea.value);
            this.value.set(parsed as T);
            this.onChange(parsed as T);
        } catch {}
    }

    onTagsChange(tags: string[]): void {
        this.value.set(tags as T);
        this.onChange(tags as T);
    }

    onRatingChange(rating: number): void {
        this.value.set(rating as T);
        this.onChange(rating as T);
    }


    onBlur(): void {
        this.isTouched.set(true);
        this.onTouched();
    }
}
