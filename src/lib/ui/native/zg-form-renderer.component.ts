import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
    output
} from '@angular/core';
import { FormSchema, FormState, FormDataType } from '../../core/form-state';
import { IField, FieldValue } from '../../core/interfaces';
import { GroupField } from '../../fields/group.field';
import { ArrayField } from '../../fields/array.field';
import { ZgAutoFieldComponent } from './zg-auto-field.component';
import { ZgNativeGroupComponent } from './zg-native-group.component';
import { ZgNativeArrayComponent } from './zg-native-array.component';
import {FormsModule} from "@angular/forms";
import {NgStyle} from "@angular/common";

/**
 * @fileoverview
 * TR: Form şemasına göre tüm alanları otomatik render eden bileşen.
 * Adapter sistemini kullanarak farklı UI kütüphaneleri destekler.
 *
 * EN: Component that automatically renders all fields based on form schema.
 * Supports different UI libraries using the adapter system.
 */

export interface FormRendererConfig {
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    showSubmitButton?: boolean;
    showResetButton?: boolean;
    submitText?: string;
    resetText?: string;
    submitDisabledWhenInvalid?: boolean;
}

@Component({
    selector: 'zg-form-renderer',
    standalone: true,
    imports: [ZgAutoFieldComponent, ZgNativeGroupComponent, ZgNativeArrayComponent, FormsModule, NgStyle],
    template: `
        <form
                class="zg-form"
                [class.zg-form--vertical]="config()?.layout === 'vertical' || !config()?.layout"
                [class.zg-form--horizontal]="config()?.layout === 'horizontal'"
                [class.zg-form--grid]="config()?.layout === 'grid'"
                [ngStyle]="{'--zg-form-columns': config()?.columns ?? 1}"
                (submit)="handleSubmit($event)">


        @for (field of fields(); track field.name) {
                <div class="zg-form-field">
                    @if (isGroupField(field)) {
                        <zg-native-group
                            [field]="asGroupField(field)"
                            [state]="getGroupState(field)"
                        />
                    } @else if (isArrayField(field)) {
                        <zg-native-array
                            [field]="asArrayField(field)"
                            [state]="getArrayState(field)"
                        />
                    } @else {
                        <zg-auto-field
                            [field]="field"
                            [ngModel]="getFieldValue(field.name)"
                            (ngModelChange)="setFieldValue(field.name, $event)"
                        />
                    }
                </div>
            }
            
            @if (config()?.showSubmitButton !== false || config()?.showResetButton) {
                <div class="zg-form-actions">
                    @if (config()?.showResetButton) {
                        <button 
                            type="button" 
                            class="zg-btn zg-btn--secondary"
                            (click)="handleReset()">
                            {{ config()?.resetText ?? 'Sıfırla' }}
                        </button>
                    }
                    @if (config()?.showSubmitButton !== false) {
                        <button 
                            type="submit" 
                            class="zg-btn zg-btn--primary"
                            [disabled]="config()?.submitDisabledWhenInvalid && !formState().valid()">
                            {{ config()?.submitText ?? 'Kaydet' }}
                        </button>
                    }
                </div>
            }
        </form>
    `,
    styles: [`
        :host {
            display: block;
            --zg-form-columns: 1;
        }

        .zg-form {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .zg-form--horizontal {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .zg-form--horizontal .zg-form-field {
            flex: 1;
            min-width: 250px;
        }

        .zg-form--grid {
            display: grid;
            grid-template-columns: repeat(var(--zg-form-columns), 1fr);
            gap: 1rem;
        }

        .zg-form-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }

        .zg-btn {
            padding: 0.625rem 1.25rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            border: 1px solid transparent;
        }

        .zg-btn--primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }

        .zg-btn--primary:hover:not(:disabled) {
            background: #2563eb;
            border-color: #2563eb;
        }

        .zg-btn--primary:disabled {
            background: #93c5fd;
            border-color: #93c5fd;
            cursor: not-allowed;
        }

        .zg-btn--secondary {
            background: white;
            color: #374151;
            border-color: #d1d5db;
        }

        .zg-btn--secondary:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZgFormRendererComponent<T extends FormDataType> {
    readonly schema = input.required<FormSchema<T>>();
    readonly formState = input.required<FormState<T>>();
    readonly config = input<FormRendererConfig>();

    readonly submitted = output<T>();
    readonly resetted = output<void>();


    readonly fields = computed(() => this.schema().getFields());

    isGroupField(field: IField<unknown>): boolean {
        return field instanceof GroupField;
    }

    isArrayField(field: IField<unknown>): boolean {
        return field instanceof ArrayField;
    }

    asGroupField(field: IField<unknown>): GroupField {
        return field as GroupField;
    }

    asArrayField(field: IField<unknown>): ArrayField {
        return field as ArrayField;
    }

    getFieldValue(name: string): unknown {
        const fields = this.formState().fields as Record<string, FieldValue<unknown>>;
        return fields[name]?.value() ?? null;
    }

    setFieldValue(name: string, value: unknown): void {
        this.formState().setValue(name as keyof T, value as T[keyof T]);
    }

    getGroupState(field: IField<unknown>): any {
        // GroupField için özel state yönetimi
        const groupField = field as GroupField;
        const currentValue = this.getFieldValue(field.name) as Record<string, unknown>;
        return groupField.createGroupState(currentValue ?? {});
    }

    getArrayState(field: IField<unknown>): any {
        // ArrayField için özel state yönetimi
        const arrayField = field as ArrayField;
        const currentValue = this.getFieldValue(field.name) as Record<string, unknown>[];
        return arrayField.createArrayState(currentValue ?? []);
    }

    async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();

        const isValid = await this.formState().validateAll();

        if (isValid) {
            try {
                const values = this.formState().getValues();
                this.submitted.emit(values);
            } catch (error) {
                console.error('Form validation failed:', error);
            }
        }
    }

    handleReset(): void {
        this.formState().reset();
        this.resetted.emit();
    }
}
