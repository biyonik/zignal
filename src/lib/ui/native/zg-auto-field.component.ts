import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    input,
    computed,
    signal,
    viewChild,
    ViewContainerRef,
    effect,
    ComponentRef,
    OnDestroy,
    Injector,
    inject,
    runInInjectionContext,
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
import { getComponentForField } from './registry';

@Component({
    selector: 'zg-auto-field',
    standalone: true,
    template: `
        @if (showLabel() && field() && !isBoolean()) {
            <label [for]="field().name" class="zg-label">
                {{ field().label }}
                @if (field().config.required) {
                    <span class="zg-required">*</span>
                }
            </label>
        }

        <ng-container #outlet></ng-container>

        @if (showHint() && field()?.config?.hint && !hasError()) {
            <div class="zg-hint">{{ field().config.hint }}</div>
        }

        @if (showErrors() && hasError()) {
            <div class="zg-error" role="alert">{{ errorMessage() }}</div>
        }
    `,
    styles: [`
        :host { display: block; margin-bottom: 1rem; }
        .zg-label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.875rem; }
        .zg-required { color: #dc2626; margin-left: 0.125rem; }
        .zg-hint { color: #6b7280; font-size: 0.75rem; margin-top: 0.25rem; }
        .zg-error { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZgAutoFieldComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => ZgAutoFieldComponent), multi: true },
    ],
})
export class ZgAutoFieldComponent<T = unknown> implements ControlValueAccessor, Validator, OnDestroy {

    private readonly injector = inject(Injector);
    private readonly outlet = viewChild('outlet', { read: ViewContainerRef });

    readonly field = input.required<IField<T>>();
    readonly showLabel = input(true);
    readonly showHint = input(true);
    readonly showErrors = input(true);

    private componentRef: ComponentRef<any> | null = null;
    private readonly _value = signal<T | null>(null);
    private readonly _touched = signal(false);
    private readonly _disabled = signal(false);

    private onChange: (value: T | null) => void = () => {};
    private onTouched: () => void = () => {};

    readonly isBoolean = computed(() => this.field()?.type === 'boolean');

    private readonly validationResult = computed(() => {
        const f = this.field();
        return f?.schema().safeParse(this._value());
    });

    readonly hasError = computed(() => {
        const result = this.validationResult();
        return this._touched() && result && !result.success;
    });

    readonly errorMessage = computed((): string | null => {
        const result = this.validationResult();
        if (!result || result.success) return null;
        return result.error?.issues?.[0]?.message ?? 'Geçersiz değer';
    });

    constructor() {
        // Field değiştiğinde component yükle
        effect(() => {
            const field = this.field();
            const container = this.outlet();
            if (field && container) {
                this.loadComponent(field, container);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroyComponent();
    }

    private loadComponent(field: IField<T>, container: ViewContainerRef): void {
        this.destroyComponent();

        const componentType = getComponentForField(field as IField<unknown>);
        if (!componentType) {
            console.warn(`[zg-auto-field] No component for field type: ${field.type}`);
            return;
        }

        runInInjectionContext(this.injector, () => {
            this.componentRef = container.createComponent(componentType);
            const instance = this.componentRef.instance;

            // Field input'unu set et
            if ('field' in instance && typeof instance.field === 'function') {
                // Signal input için - Angular 17+ InputSignal
                const fieldSignal = instance.field as any;
                if (fieldSignal.set) {
                    fieldSignal.set(field);
                }
            }

            // Mevcut değeri yaz
            if (this._value() !== null && 'writeValue' in instance) {
                instance.writeValue(this._value());
            }

            // Disabled state
            if (this._disabled() && 'setDisabledState' in instance) {
                instance.setDisabledState(true);
            }

            // Change callback
            if ('registerOnChange' in instance) {
                instance.registerOnChange((val: T) => {
                    this._value.set(val);
                    this.onChange(val);
                });
            }

            // Touch callback
            if ('registerOnTouched' in instance) {
                instance.registerOnTouched(() => {
                    this._touched.set(true);
                    this.onTouched();
                });
            }

            // valueChange output dinle
            if ('valueChange' in instance && instance.valueChange?.subscribe) {
                instance.valueChange.subscribe((val: T) => {
                    this._value.set(val);
                    this.onChange(val);
                });
            }

            // blurred output dinle
            if ('blurred' in instance && instance.blurred?.subscribe) {
                instance.blurred.subscribe(() => {
                    this._touched.set(true);
                    this.onTouched();
                });
            }
        });
    }

    private destroyComponent(): void {
        this.componentRef?.destroy();
        this.componentRef = null;
    }

    // ControlValueAccessor
    writeValue(val: T | null): void {
        this._value.set(val);
        if (this.componentRef?.instance?.writeValue) {
            this.componentRef.instance.writeValue(val);
        }
    }

    registerOnChange(fn: (value: T | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this._disabled.set(disabled);
        if (this.componentRef?.instance?.setDisabledState) {
            this.componentRef.instance.setDisabledState(disabled);
        }
    }

    // Validator
    validate(control: AbstractControl): ValidationErrors | null {
        const result = this.field()?.schema().safeParse(control.value);
        if (!result || result.success) return null;

        const errors: ValidationErrors = {};
        for (const issue of result.error?.issues ?? []) {
            errors[issue.code || 'zodError'] = {
                message: issue.message,
                path: issue.path,
            };
        }
        return Object.keys(errors).length ? errors : null;
    }
}
