import {
    Directive,
    OnInit,
    OnDestroy,
    ElementRef,
    Renderer2,
    inject,
    effect,
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
import { IField, FieldValue } from '../core/interfaces';

@Directive({
    selector: '[zgField]',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ZgFieldDirective,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: ZgFieldDirective,
            multi: true,
        },
    ],
})
export class ZgFieldDirective<T = unknown>
    implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
    private readonly el = inject(ElementRef);
    private readonly renderer = inject(Renderer2);
    readonly field = input.required<IField<T>>({ alias: 'zgField' });
    readonly fieldState = input<FieldValue<T>>();

    private onChange: (value: T) => void = () => {};
    private onTouched: () => void = () => {};
    private internalState?: FieldValue<T>;
    private effectRef?: ReturnType<typeof effect>;
    private listenerCleanups: (() => void)[] = [];

    get state(): FieldValue<T> {
        return this.fieldState() ?? this.internalState!;
    }

    ngOnInit(): void {
        if (!this.fieldState()) {
            this.internalState = this.field().createValue();
        }

        this.applyFieldAttributes();
        this.setupValueSync();
    }

    ngOnDestroy(): void {
        // Effect'i temizle
        this.effectRef?.destroy();

        // Listener'ları temizle
        this.listenerCleanups.forEach(cleanup => cleanup());
        this.listenerCleanups = [];
    }

    writeValue(value: T): void {
        if (this.state) {
            this.state.value.set(value);
        }
        this.updateElementValue(value);
    }

    registerOnChange(fn: (value: T) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
    }

    validate(control: AbstractControl): ValidationErrors | null {
        const f = this.field();
        if (!f) return null;

        const result = f.schema().safeParse(control.value);
        if (result.success) return null;

        const errors: ValidationErrors = {};
        for (const issue of result.error.issues) {
            errors[issue.code || 'zodError'] = {
                message: issue.message,
                path: issue.path,
            };
        }
        return errors;
    }

    private applyFieldAttributes(): void {
        const el = this.el.nativeElement;
        const config = this.field().config;

        if (config.placeholder) {
            this.renderer.setAttribute(el, 'placeholder', config.placeholder);
        }
        if (config.required) {
            this.renderer.setAttribute(el, 'required', '');
        }
        if (config.disabled) {
            this.renderer.setProperty(el, 'disabled', true);
        }
        if (config.readonly) {
            this.renderer.setAttribute(el, 'readonly', '');
        }
        this.renderer.setAttribute(el, 'aria-label', this.field().label);
    }

    private setupValueSync(): void {
        const el = this.el.nativeElement;

        // Input event
        const inputCleanup = this.renderer.listen(el, 'input', (event: Event) => {
            const value = this.parseInputValue(event.target as HTMLInputElement);
            this.state.value.set(value as T);
            this.onChange(value as T);
        });
        this.listenerCleanups.push(inputCleanup);

        // Blur event
        const blurCleanup = this.renderer.listen(el, 'blur', () => {
            this.state.touched.set(true);
            this.onTouched();
        });
        this.listenerCleanups.push(blurCleanup);

        // State → Element sync
        this.effectRef = effect(() => {
            const value = this.state.value();
            this.updateElementValue(value);
        });
    }

    private parseInputValue(target: HTMLInputElement): unknown {
        switch (target.type) {
            case 'number':
            case 'range':
                return target.valueAsNumber;
            case 'checkbox':
                return target.checked;
            case 'date':
            case 'datetime-local':
                return target.valueAsDate;
            default:
                return target.value;
        }
    }

    private updateElementValue(value: T): void {
        const el = this.el.nativeElement;
        const type = el.type;

        if (type === 'checkbox') {
            this.renderer.setProperty(el, 'checked', !!value);
        } else if (type === 'date' && value instanceof Date) {
            this.renderer.setProperty(el, 'value', value.toISOString().split('T')[0]);
        } else {
            this.renderer.setProperty(el, 'value', value ?? '');
        }
    }
}
