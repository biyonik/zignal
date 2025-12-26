import { FieldValue } from './field-value.interface';

/**
 * TR: Field hook context.
 * EN: Field hook context.
 */
export interface FieldHookContext<T = unknown> {
    /** TR: Field adı / EN: Field name */
    fieldName: string;

    /** TR: Field'ın mevcut değeri / EN: Current value of the field */
    value: T;

    /** TR: Form'daki tüm değerler / EN: All values in the form */
    formValues: Record<string, unknown>;

    /** TR: Field state / EN: Field state */
    fieldState: FieldValue<T>;
}

/**
 * TR: onChange hook için ek context.
 * EN: Additional context for onChange hook.
 */
export interface OnChangeContext<T = unknown> extends FieldHookContext<T> {
    /** TR: Önceki değer / EN: Previous value */
    previousValue: T;
}

/**
 * TR: onValidate hook için ek context.
 * EN: Additional context for onValidate hook.
 */
export interface OnValidateContext<T = unknown> extends FieldHookContext<T> {
    /** TR: Geçerli mi? / EN: Is valid? */
    isValid: boolean;

    /** TR: Hata mesajı / EN: Error message */
    error: string | null;
}

/**
 * TR: Field lifecycle hooks.
 * EN: Field lifecycle hooks.
 */
export interface FieldHooks<T = unknown> {
    /** TR: Field değeri değiştiğinde / EN: When field value changes */
    onChange?: (context: OnChangeContext<T>) => void;

    /** TR: Field touched olduğunda / EN: When field becomes touched */
    onTouched?: (context: FieldHookContext<T>) => void;

    /** TR: Validasyon sonrası / EN: After validation */
    onValidate?: (context: OnValidateContext<T>) => void;

    /** TR: Form reset edildiğinde / EN: When form is reset */
    onReset?: (context: FieldHookContext<T>) => void;
}
