import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { SelectField } from '../../../fields/select.field';

@Component({
    selector: 'zg-select',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgSelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgSelectComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-select-field" [class]="cssClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <select
                [id]="field().name"
                [name]="field().name"
                [disabled]="disabledStatus"
                [attr.aria-label]="field().label"
                [attr.aria-invalid]="showError"
                [class.zg-invalid]="showError"
                class="zg-select"
                (change)="onSelect($event)"
                (blur)="handleBlur()"
            >
                <option value="" [selected]="value == null">
                    {{ field().config.emptyLabel ?? 'Seçiniz...' }}
                </option>

                <ng-container *ngIf="!hasGroups; else groupedOptions">
                    <option
                        *ngFor="let opt of field().getOptions()"
                        [value]="opt.value"
                        [selected]="value === opt.value"
                        [disabled]="opt.disabled"
                    >
                        {{ opt.label }}
                    </option>
                </ng-container>

                <ng-template #groupedOptions>
                    <optgroup *ngFor="let group of groups" [label]="group.name">
                        <option
                            *ngFor="let opt of group.options"
                            [value]="opt.value"
                            [selected]="value === opt.value"
                            [disabled]="opt.disabled"
                        >
                            {{ opt.label }}
                        </option>
                    </optgroup>
                </ng-template>
            </select>

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
        .zg-select {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background-color: white;
            cursor: pointer;
        }
        .zg-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-select.zg-invalid { border-color: #ef4444; }
        .zg-select:disabled { background-color: #f3f4f6; cursor: not-allowed; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgSelectComponent<T = string> extends BaseNativeComponent<SelectField<T>, T> {
    get hasGroups(): boolean {
        return this.field().getOptions().some((opt) => opt.group != null);
    }

    get groups(): { name: string; options: any }[] {
        const grouped = this.field().getGroupedOptions();
        const result: { name: string; options: any }[] = [];

        grouped.forEach((options, groupName) => {
            if (groupName != null) {
                result.push({ name: groupName, options });
            }
        });

        return result;
    }

    onSelect(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const value = select.value === '' ? null : (select.value as unknown as T);
        this.updateValue(value as T);
    }
}
