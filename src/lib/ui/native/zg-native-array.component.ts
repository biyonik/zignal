import {
    Component,
    ChangeDetectionStrategy,
    input,

} from '@angular/core';
import { ArrayField, ArrayFieldState, ArrayItemState } from '../../fields/array.field';
import { ZgAutoFieldComponent } from './zg-auto-field.component';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import {FormsModule} from "@angular/forms";

/**
 * @fileoverview
 * TR: ArrayField için Native UI render bileşeni.
 * Tekrarlayan (repeater) form satırlarını yönetir.
 *
 * EN: Native UI render component for ArrayField.
 * Manages repeating form rows.
 */
@Component({
    selector: 'zg-native-array',
    standalone: true,
    imports: [ZgAutoFieldComponent, DragDropModule, FormsModule],
    template: `
        <div class="zg-array">
            <div class="zg-array-header">
                <span class="zg-array-label">{{ field().label }}</span>
                <span class="zg-array-count">{{ state().count() }} kayıt</span>
            </div>

            <div 
                class="zg-array-items"
                cdkDropList
                [cdkDropListDisabled]="!field().config.sortable"
                (cdkDropListDropped)="onDrop($event)">
                
                @for (item of state().items(); track item.id; let idx = $index) {
                    <div 
                        class="zg-array-item"
                        [class.zg-array-item--invalid]="!item.valid()"
                        cdkDrag
                        [cdkDragDisabled]="!field().config.sortable">
                        
                        <div class="zg-array-item-header">
                            @if (field().config.sortable) {
                                <span class="zg-array-drag-handle" cdkDragHandle>⋮⋮</span>
                            }
                            <span class="zg-array-item-title">{{ field().getItemTitle(idx) }}</span>
                            <button 
                                type="button"
                                class="zg-array-remove-btn"
                                [disabled]="!state().canRemove()"
                                (click)="removeItem(item.id)"
                                [title]="field().config.removeLabel ?? 'Sil'">
                                ✕
                            </button>
                        </div>
                        
                        <div class="zg-array-item-fields">
                            @for (subField of field().getItemFields(); track subField.name) {
                                <div class="zg-array-field">
                                    <zg-auto-field
                                        [field]="subField"
                                        [ngModel]="getItemFieldValue(item, subField.name)"
                                        (ngModelChange)="setItemFieldValue(item, subField.name, $event)"
                                    />
                                </div>
                            }
                        </div>
                        
                        @if (!item.valid()) {
                            <div class="zg-array-item-errors">
                                @for (error of getItemErrors(item); track error.field) {
                                    <span class="zg-array-item-error">{{ error.field }}: {{ error.message }}</span>
                                }
                            </div>
                        }
                    </div>
                }
            </div>

            @if (state().items().length === 0) {
                <div class="zg-array-empty">
                    Henüz kayıt eklenmedi
                </div>
            }

            <div class="zg-array-footer">
                <button 
                    type="button"
                    class="zg-array-add-btn"
                    [disabled]="!state().canAdd()"
                    (click)="addItem()">
                    + {{ field().config.addLabel ?? 'Ekle' }}
                </button>
                
                @if (field().config.min) {
                    <span class="zg-array-limits">Min: {{ field().config.min }}</span>
                }
                @if (field().config.max) {
                    <span class="zg-array-limits">Max: {{ field().config.max }}</span>
                }
            </div>
        </div>
    `,
    styles: [`
        .zg-array {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .zg-array-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .zg-array-label {
            font-weight: 600;
            font-size: 0.875rem;
            color: #374151;
        }
        
        .zg-array-count {
            font-size: 0.75rem;
            color: #6b7280;
            background: #f3f4f6;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
        }
        
        .zg-array-items {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .zg-array-item {
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 0.75rem;
            background: #fafafa;
        }
        
        .zg-array-item--invalid {
            border-color: #fca5a5;
            background: #fef2f2;
        }
        
        .zg-array-item-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .zg-array-drag-handle {
            cursor: grab;
            color: #9ca3af;
            user-select: none;
        }
        
        .zg-array-drag-handle:active {
            cursor: grabbing;
        }
        
        .zg-array-item-title {
            flex: 1;
            font-size: 0.75rem;
            font-weight: 500;
            color: #6b7280;
        }
        
        .zg-array-remove-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            font-size: 1rem;
            padding: 0.25rem;
            line-height: 1;
        }
        
        .zg-array-remove-btn:hover:not(:disabled) {
            color: #dc2626;
        }
        
        .zg-array-remove-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .zg-array-item-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }
        
        .zg-array-item-errors {
            margin-top: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .zg-array-item-error {
            font-size: 0.7rem;
            color: #dc2626;
            background: #fee2e2;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
        }
        
        .zg-array-empty {
            text-align: center;
            padding: 2rem;
            color: #9ca3af;
            font-size: 0.875rem;
        }
        
        .zg-array-footer {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .zg-array-add-btn {
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background 0.15s;
        }
        
        .zg-array-add-btn:hover:not(:disabled) {
            background: #2563eb;
        }
        
        .zg-array-add-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        
        .zg-array-limits {
            font-size: 0.75rem;
            color: #6b7280;
        }
        
        /* Drag & Drop */
        .cdk-drag-preview {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .cdk-drag-placeholder {
            opacity: 0.5;
        }
        
        .cdk-drag-animating {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZgNativeArrayComponent {
    readonly field = input.required<ArrayField>();
    readonly state = input.required<ArrayFieldState>();

    addItem(): void {
        this.state().add();
    }

    removeItem(id: string): void {
        this.state().remove(id);
    }

    onDrop(event: CdkDragDrop<ArrayItemState[]>): void {
        if (event.previousIndex !== event.currentIndex) {
            this.state().move(event.previousIndex, event.currentIndex);
        }
    }

    getItemFieldValue(item: ArrayItemState, fieldName: string): unknown {
        return item.fields[fieldName]?.value() ?? null;
    }

    setItemFieldValue(item: ArrayItemState, fieldName: string, value: unknown): void {
        const fieldValue = item.fields[fieldName];
        if (fieldValue) {
            fieldValue.value.set(value);
        }
    }

    getItemErrors(item: ArrayItemState): { field: string; message: string }[] {
        const errors = item.errors();
        return Object.entries(errors)
            .filter(([, msg]) => msg !== null)
            .map(([field, message]) => ({ field, message: message! }));
    }
}
