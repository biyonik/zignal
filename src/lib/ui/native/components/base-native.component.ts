import {Directive, signal, input, output} from '@angular/core';
import { ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { IField, FieldValue } from '../../../core/interfaces';

/**
 * TR: Tüm native component'ler için ortak base directive.
 * EN: Common base directive for all native components.
 */
@Directive()
export abstract class BaseNativeComponent<TField extends IField<TValue>, TValue>
    implements ControlValueAccessor, Validator
{
    /**
     * TR: Bağlı field.
     * EN: Bound field.
     */
    field = input.required<TField>();

    /**
     * TR: Field state (opsiyonel - otomatik oluşturulur).
     * EN: Field state (optional - auto created).
     */
    state = input<FieldValue<TValue>>();

    /**
     * TR: Disabled durumu.
     * EN: Disabled state.
     */
    private _disabled = signal<boolean>(false);
    get disabledStatus(): boolean {
        return this._disabled();
    }
    disabledInput = input<boolean>(false, { alias: 'disabled' });

    /**
     * TR: Readonly durumu.
     * EN: Readonly state.
     */
    readonly = input<boolean>(false);

    /**
     * TR: CSS sınıfları.
     * EN: CSS classes.
     */
    cssClass = input<string>('');

    /**
     * TR: Değer değiştiğinde.
     * EN: On value change.
     */
    valueChange = output<TValue>();

    /**
     * TR: Blur olduğunda.
     * EN: On blur.
     */
    blurred = output<void>();

    protected internalState?: FieldValue<TValue>;
    protected onChange: (value: TValue | Event) => void = () => {};
    protected onTouched: () => void = () => {};

    /**
     * TR: Aktif state.
     * EN: Active state.
     */
    get activeState(): FieldValue<TValue> {
        return this.state() ?? this.internalState!;
    }

    /**
     * TR: Mevcut değer.
     * EN: Current value.
     */
    get value(): TValue {
        return this.activeState.value();
    }

    /**
     * TR: Hata mesajı.
     * EN: Error message.
     */
    get error(): string | null {
        return this.activeState.error();
    }

    /**
     * TR: Geçerli mi?
     * EN: Is valid?
     */
    get isValid(): boolean {
        return this.activeState.valid();
    }

    /**
     * TR: Touched mı?
     * EN: Is touched?
     */
    get isTouched(): boolean {
        return this.activeState.touched();
    }

    /**
     * TR: Hata gösterilmeli mi?
     * EN: Should show error?
     */
    get showError(): boolean {
        return this.isTouched && this.error !== null;
    }

    /**
     * TR: Field props erişimi.
     * EN: Field props access.
     */
    get props() {
        return this.field().config.props;
    }

    /**
     * TR: Wrapper CSS class (props.cssClass + dışarıdan gelen cssClass).
     * EN: Wrapper CSS class (props.cssClass + external cssClass).
     */
    get wrapperClass(): string {
        const propsClass = this.props?.cssClass ?? '';
        const inputClass = typeof this.cssClass === 'function' ? this.cssClass() : this.cssClass;
        return `${propsClass} ${inputClass}`.trim();
    }

    /**
     * TR: Input CSS class.
     * EN: Input CSS class.
     */
    get inputCssClass(): string {
        return this.props?.inputClass ?? '';
    }

    /**
     * TR: Label CSS class.
     * EN: Label CSS class.
     */
    get labelCssClass(): string {
        return this.props?.labelClass ?? '';
    }

    /**
     * TR: Prefix text.
     * EN: Prefix text.
     */
    get prefixText(): string | undefined {
        return this.props?.prefix;
    }

    /**
     * TR: Suffix text.
     * EN: Suffix text.
     */
    get suffixText(): string | undefined {
        return this.props?.suffix;
    }

    /**
     * TR: Prefix icon.
     * EN: Prefix icon.
     */
    get prefixIcon(): string | undefined {
        return this.props?.prefixIcon;
    }

    /**
     * TR: Suffix icon.
     * EN: Suffix icon.
     */
    get suffixIcon(): string | undefined {
        return this.props?.suffixIcon;
    }

    /**
     * TR: Extra HTML attributes.
     * EN: Extra HTML attributes.
     */
    get extraAttributes(): Record<string, string | number | boolean> {
        return this.props?.attributes ?? {};
    }

    /**
     * TR: Autofocus.
     * EN: Autofocus.
     */
    get shouldAutofocus(): boolean {
        return this.props?.autofocus ?? false;
    }

    /**
     * TR: Autocomplete.
     * EN: Autocomplete.
     */
    get autocompleteValue(): string | undefined {
        return this.props?.autocomplete;
    }

    /**
     * TR: Tab index.
     * EN: Tab index.
     */
    get tabIndex(): number | undefined {
        return this.props?.tabindex;
    }

    /**
     * TR: Max length.
     * EN: Max length.
     */
    get maxLengthValue(): number | undefined {
        return this.props?.maxLength;
    }

    ngOnInit(): void {
        if (!this.state()) {
            this.internalState = this.field().createValue();
        }
        // Sync disabled input to signal
        this._disabled.set(this.disabledInput());
    }

    // ControlValueAccessor
    writeValue(value: TValue): void {
        this.activeState.value.set(value);
    }

    registerOnChange(fn: (value: TValue | Event) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabled.set(isDisabled);
    }

    // Validator
    validate(control: AbstractControl): ValidationErrors | null {
        const result = this.field().schema().safeParse(control.value);
        if (result.success) return null;

        const errors: ValidationErrors = {};
        for (const issue of result.error.issues) {
            errors[issue.code || 'zodError'] = issue.message;
        }
        return errors;
    }

    /**
     * TR: Değeri güncelle.
     * EN: Update value.
     */
    protected updateValue(value: TValue): void {
        this.activeState.value.set(value);
        this.onChange(value);
        this.valueChange.emit(value);
    }

    /**
     * TR: Blur handle.
     * EN: Handle blur.
     */
    protected handleBlur(): void {
        this.activeState.touched.set(true);
        this.onTouched();
        this.blurred.emit();
    }
}
