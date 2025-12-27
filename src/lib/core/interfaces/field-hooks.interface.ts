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
 * TR: Hook expression tipi.
 * Fonksiyon veya string expression olabilir.
 *
 * EN: Hook expression type.
 * Can be function or string expression.
 *
 * @example
 * ```typescript
 * // Fonksiyon olarak
 * onChange: (ctx) => console.log('Changed:', ctx.value)
 *
 * // String expression olarak (JSON'a çevrilebilir!)
 * onChange: "console.log('Changed:', value)"
 * ```
 */
export type HookExpression<TContext = unknown> =
    | ((context: TContext) => void)
    | string;

/**
 * TR: Field lifecycle hooks.
 *
 * Hooks artık hem fonksiyon hem de string expression destekler!
 * String expression'lar JSON'a çevrilebilir ve backend'e kaydedilebilir.
 *
 * EN: Field lifecycle hooks.
 *
 * Hooks now support both functions and string expressions!
 * String expressions can be serialized to JSON and saved to backend.
 *
 * @example
 * ```typescript
 * // Fonksiyon ile (runtime only)
 * hooks: {
 *   onChange: (ctx) => {
 *     console.log('Value changed:', ctx.value);
 *     if (ctx.value.length > 10) {
 *       console.warn('Too long!');
 *     }
 *   }
 * }
 *
 * // String expression ile (JSON'a çevrilebilir!)
 * hooks: {
 *   onChange: "console.log('Value changed:', value)",
 *   onTouched: "console.log('Field touched:', fieldName)",
 *   onValidate: `
 *     if (!isValid) {
 *       console.error('Validation failed:', error);
 *     }
 *   `
 * }
 * ```
 */
export interface FieldHooks<T = unknown> {
    /**
     * TR: Field değeri değiştiğinde çalışır.
     * EN: Runs when field value changes.
     *
     * @example
     * ```typescript
     * // String expression
     * onChange: "console.log('New value:', value)"
     *
     * // Fonksiyon
     * onChange: (ctx) => console.log('New value:', ctx.value)
     * ```
     */
    onChange?: HookExpression<OnChangeContext<T>>;

    /**
     * TR: Field touched olduğunda çalışır.
     * EN: Runs when field becomes touched.
     *
     * @example
     * ```typescript
     * onTouched: "console.log('User touched:', fieldName)"
     * ```
     */
    onTouched?: HookExpression<FieldHookContext<T>>;

    /**
     * TR: Validasyon sonrası çalışır.
     * EN: Runs after validation.
     *
     * @example
     * ```typescript
     * onValidate: `
     *   if (!isValid) {
     *     console.error('Validation failed for', fieldName, ':', error);
     *   }
     * `
     * ```
     */
    onValidate?: HookExpression<OnValidateContext<T>>;

    /**
     * TR: Form reset edildiğinde çalışır.
     * EN: Runs when form is reset.
     *
     * @example
     * ```typescript
     * onReset: "console.log('Field reset:', fieldName)"
     * ```
     */
    onReset?: HookExpression<FieldHookContext<T>>;
}
