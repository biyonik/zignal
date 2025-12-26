import {Component, forwardRef, ElementRef, ViewChild, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { TagsField } from '../../../fields/tags.field';

@Component({
    selector: 'zg-tags',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgTagsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgTagsComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-tags-field" [class]="cssClass">
            <label *ngIf="field().label" [for]="field().name" class="zg-label">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div 
                class="zg-tags-container"
                [class.zg-focused]="isFocused"
                [class.zg-invalid]="showError"
                (click)="focusInput()"
            >
                <!-- Tags -->
                <span *ngFor="let tag of value ?? []; let i = index" class="zg-tag">
                    {{ tag }}
                    <button
                        type="button"
                        class="zg-tag-remove"
                        [disabled]="disabledStatus"
                        (click)="removeTag(i, $event)"
                        aria-label="Kaldır"
                    >
                        ×
                    </button>
                </span>

                <!-- Input -->
                <input
                    #tagInput
                    type="text"
                    [id]="field().name"
                    [placeholder]="inputPlaceholder"
                    [disabled]="disabledStatus"
                    class="zg-tags-input"
                    (keydown)="onKeyDown($event)"
                    (input)="onInput($event)"
                    (focus)="isFocused = true"
                    (blur)="onBlur()"
                />
            </div>

            <!-- Suggestions -->
            <div *ngIf="showSuggestions && filteredSuggestions.length > 0" class="zg-suggestions">
                <button
                    *ngFor="let suggestion of filteredSuggestions"
                    type="button"
                    class="zg-suggestion"
                    (click)="addTag(suggestion)"
                >
                    {{ suggestion }}
                </button>
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
            position: relative;
        }
        .zg-label { font-weight: 500; font-size: 14px; }
        .zg-required { color: #ef4444; }
        .zg-tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 6px 8px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            min-height: 42px;
            cursor: text;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .zg-tags-container.zg-focused {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .zg-tags-container.zg-invalid {
            border-color: #ef4444;
        }
        .zg-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background-color: #e0e7ff;
            color: #3730a3;
            border-radius: 4px;
            font-size: 13px;
        }
        .zg-tag-remove {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            color: #6366f1;
            padding: 0;
        }
        .zg-tag-remove:hover {
            color: #4338ca;
        }
        .zg-tags-input {
            flex: 1;
            min-width: 100px;
            border: none;
            outline: none;
            font-size: 14px;
            padding: 4px 0;
        }
        .zg-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 10;
            max-height: 200px;
            overflow-y: auto;
        }
        .zg-suggestion {
            display: block;
            width: 100%;
            padding: 8px 12px;
            text-align: left;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .zg-suggestion:hover {
            background-color: #f3f4f6;
        }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgTagsComponent extends BaseNativeComponent<TagsField, string[]> implements OnDestroy{
    @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

    isFocused = false;
    inputValue = '';
    showSuggestions = false;
    private blurTimeout: ReturnType<typeof setTimeout> | null = null;

    ngOnDestroy(): void {
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
            this.blurTimeout = null;
        }
    }

    get inputPlaceholder(): string {
        const current = this.value?.length ?? 0;
        const max = this.field().config.maxTags;

        if (max && current >= max) {
            return 'Maksimum tag sayısına ulaşıldı';
        }

        return this.field().config.placeholder ?? 'Tag ekle...';
    }

    get filteredSuggestions(): string[] {
        const suggestions = this.field().getSuggestions();
        const currentTags = this.value ?? [];
        const input = this.inputValue.toLowerCase();

        return suggestions.filter(
            (s) =>
                !currentTags.includes(s) &&
                s.toLowerCase().includes(input)
        );
    }

    focusInput(): void {
        this.tagInput?.nativeElement.focus();
    }

    onKeyDown(event: KeyboardEvent): void {
        const separators = this.field().config.separators ?? [',', ';'];

        if (event.key === 'Enter' || separators.includes(event.key)) {
            event.preventDefault();
            this.addCurrentTag();
        } else if (event.key === 'Backspace' && this.inputValue === '') {
            this.removeLastTag();
        }
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.inputValue = input.value;
        this.showSuggestions = this.inputValue.length > 0;
    }

    onBlur(): void {
        this.isFocused = false;
        this.handleBlur();

        // Clear previous timeout
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }

        // Delay to allow suggestion click
        this.blurTimeout = setTimeout(() => {
            this.showSuggestions = false;
            if (this.inputValue.trim()) {
                this.addCurrentTag();
            }
            this.blurTimeout = null;
        }, 200);
    }

    addCurrentTag(): void {
        if (this.inputValue.trim()) {
            this.addTag(this.inputValue.trim());
        }
    }

    addTag(tag: string): void {
        const normalized = this.field().normalizeTag(tag);
        if (!normalized) return;

        const currentTags = this.value ?? [];
        const max = this.field().config.maxTags;

        // Max kontrolü
        if (max && currentTags.length >= max) return;

        // Duplicate kontrolü
        if (!this.field().config.allowDuplicates && currentTags.includes(normalized)) return;

        const newTags = [...currentTags, normalized];
        this.updateValue(newTags);

        // Input temizle
        this.inputValue = '';
        if (this.tagInput) {
            this.tagInput.nativeElement.value = '';
        }
        this.showSuggestions = false;
    }

    removeTag(index: number, event?: Event): void {
        event?.stopPropagation();
        const currentTags = this.value ?? [];
        const newTags = currentTags.filter((_, i) => i !== index);
        this.updateValue(newTags);
    }

    removeLastTag(): void {
        const currentTags = this.value ?? [];
        if (currentTags.length > 0) {
            this.removeTag(currentTags.length - 1);
        }
    }
}
