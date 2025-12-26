import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { MultiselectField } from '../../../fields/multiselect.field';

@Component({
    selector: 'zg-multiselect',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgMultiselectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgMultiselectComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-multiselect-field" [class]="cssClass()">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div class="zg-multiselect-container" [class.zg-invalid]="showError">
                <div class="zg-multiselect-selected">
                    <span *ngFor="let val of selectedValues" class="zg-chip">
                        {{ getLabel(val) }}
                        <button 
                            type="button" 
                            class="zg-chip-remove"
                            [disabled]="disabledStatus"
                            (click)="removeValue(val)"
                        >×</button>
                    </span>
                </div>

                <select
                    [id]="field().name"
                    [disabled]="disabledStatus || isMaxSelected"
                    class="zg-select"
                    (change)="onAdd($event)"
                    (blur)="handleBlur()"
                >
                    <option value="">{{ placeholder }}</option>
                    <option 
                        *ngFor="let option of availableOptions" 
                        [value]="option.value"
                        [disabled]="option.disabled"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <div class="zg-multiselect-footer">
                <small *ngIf="field().config.hint && !showError" class="zg-hint">
                    {{ field().config.hint }}
                </small>
                <small *ngIf="field().config.maxSelections" class="zg-count">
                    {{ selectedValues.length }} / {{ field().config.maxSelections }}
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
        .zg-multiselect-container {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 6px;
        }
        .zg-multiselect-container.zg-invalid { border-color: #ef4444; }
        .zg-multiselect-selected {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            min-height: 24px;
            margin-bottom: 6px;
        }
        .zg-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 4px;
            font-size: 13px;
        }
        .zg-chip-remove {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            color: #6366f1;
            padding: 0 2px;
        }
        .zg-chip-remove:hover { color: #4338ca; }
        .zg-chip-remove:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-select {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 14px;
            background: white;
        }
        .zg-select:disabled { background: #f3f4f6; cursor: not-allowed; }
        .zg-multiselect-footer {
            display: flex;
            justify-content: space-between;
        }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-count { color: #9ca3af; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgMultiselectComponent extends BaseNativeComponent<MultiselectField<unknown>, unknown[]> {
    get selectedValues(): unknown[] {
        return this.value ?? [];
    }

    get options(): Array<{ value: unknown; label: string; disabled?: boolean }> {
        return this.field().config.options ?? [];
    }

    get availableOptions() {
        return this.options.filter(opt => !this.selectedValues.includes(opt.value));
    }

    get isMaxSelected(): boolean {
        const max = this.field().config.maxSelections;
        return max !== undefined && this.selectedValues.length >= max;
    }

    get placeholder(): string {
        if (this.isMaxSelected) return 'Maksimum seçime ulaşıldı';
        return this.field().config.placeholder ?? 'Seçiniz...';
    }

    getLabel(val: unknown): string {
        const opt = this.options.find(o => o.value === val);
        return opt?.label ?? String(val);
    }

    onAdd(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const val = select.value;
        if (!val) return;

        const option = this.options.find(o => String(o.value) === val);
        if (option) {
            const newValues = [...this.selectedValues, option.value];
            this.updateValue(newValues);
        }
        select.value = '';
    }

    removeValue(val: unknown): void {
        const newValues = this.selectedValues.filter(v => v !== val);
        this.updateValue(newValues);
    }
}
