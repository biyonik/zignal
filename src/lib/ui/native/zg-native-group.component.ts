import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
    signal,
} from '@angular/core';
import { GroupField, GroupFieldState } from '../../fields/group.field';
import { ZgAutoFieldComponent } from './zg-auto-field.component';
import {FormsModule} from "@angular/forms";

/**
 * @fileoverview
 * TR: GroupField için Native UI render bileşeni.
 * İç içe (nested) form alanlarını gruplar.
 *
 * EN: Native UI render component for GroupField.
 * Groups nested form fields.
 */
@Component({
    selector: 'zg-native-group',
    standalone: true,
    imports: [ZgAutoFieldComponent, FormsModule],
    template: `
        <fieldset 
            class="zg-group"
            [class.zg-group--collapsible]="field().collapsible"
            [class.zg-group--collapsed]="isCollapsed()">
            
            @if (field().config.showTitle !== false) {
                <legend class="zg-group-legend" (click)="toggleCollapse()">
                    {{ field().label }}
                    @if (field().collapsible) {
                        <span class="zg-group-toggle">{{ isCollapsed() ? '▶' : '▼' }}</span>
                    }
                </legend>
            }
            
            @if (!isCollapsed()) {
                <div
                        class="zg-group-content"
                        [class.zg-group-content--vertical]="field().layout === 'vertical'"
                        [class.zg-group-content--horizontal]="field().layout === 'horizontal'"
                        [class.zg-group-content--grid]="field().layout === 'grid'"
                        [style.--zg-grid-columns]="field().columns">

                @for (subField of field().getFields(); track subField.name) {
                        <div class="zg-group-field">
                            <zg-auto-field
                                [field]="subField"
                                [ngModel]="getFieldValue(subField.name)"
                                (ngModelChange)="setFieldValue(subField.name, $event)"
                            />
                        </div>
                    }
                </div>
            }
            
            @if (showErrors() && groupError()) {
                <div class="zg-group-error" role="alert">{{ groupError() }}</div>
            }
        </fieldset>
    `,
    styles: [`
        :host {
            display: block;
            --zg-grid-columns: 2;
        }

        .zg-group {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
        }

        .zg-group-legend {
            font-weight: 600;
            font-size: 0.875rem;
            color: #374151;
            padding: 0 0.5rem;
        }

        .zg-group--collapsible .zg-group-legend {
            cursor: pointer;
            user-select: none;
        }

        .zg-group-toggle {
            font-size: 0.75rem;
            margin-left: 0.5rem;
        }

        .zg-group-content {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .zg-group-content--horizontal {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .zg-group-content--horizontal .zg-group-field {
            flex: 1;
            min-width: 200px;
        }

        .zg-group-content--grid {
            display: grid;
            grid-template-columns: repeat(var(--zg-grid-columns), 1fr);
            gap: 1rem;
        }

        .zg-group-error {
            color: #dc2626;
            font-size: 0.75rem;
            margin-top: 0.5rem;
        }

        .zg-group--collapsed .zg-group-content {
            display: none;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZgNativeGroupComponent {
    readonly field = input.required<GroupField>();
    readonly state = input.required<GroupFieldState>();
    readonly showErrors = input(true);

    readonly isCollapsed = signal(false);

    constructor() {
        // Initialize collapsed state from config
        const field = this.field();
        if (field?.config?.collapsed) {
            this.isCollapsed.set(true);
        }
    }

    readonly groupError = computed((): string | null => {
        const errors = Object.values(this.state().errors()).filter(Boolean);
        return errors.length > 0 ? errors[0] : null;
    });

    toggleCollapse(): void {
        if (this.field().collapsible) {
            this.isCollapsed.update(v => !v);
        }
    }

    getFieldValue(name: string): unknown {
        return this.state().fields[name]?.value() ?? null;
    }

    setFieldValue(name: string, value: unknown): void {
        this.state().setValue(name, value);
    }
}
