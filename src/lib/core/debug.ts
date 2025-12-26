import { Signal, effect } from '@angular/core';

/**
 * @fileoverview
 * TR: Zignal debug utilities.
 * Geliştirme ortamında form state debugging için yardımcı fonksiyonlar.
 *
 * EN: Zignal debug utilities.
 * Helper functions for form state debugging in development environment.
 */

export interface ZignalDebugOptions {
    /**
     * TR: Konsola log yazsın mı?
     * EN: Should log to console?
     * @default true
     */
    console?: boolean;

    /**
     * TR: Değer değişikliklerini logla
     * EN: Log value changes
     * @default true
     */
    logValues?: boolean;

    /**
     * TR: Validation sonuçlarını logla
     * EN: Log validation results
     * @default true
     */
    logValidation?: boolean;

    /**
     * TR: Touched değişikliklerini logla
     * EN: Log touched changes
     * @default false
     */
    logTouched?: boolean;

    /**
     * TR: Log prefix
     * EN: Log prefix
     * @default '[Zignal]'
     */
    prefix?: string;

    /**
     * TR: Gruplandırma kullan
     * EN: Use console grouping
     * @default true
     */
    grouped?: boolean;
}

const DEFAULT_OPTIONS: Required<ZignalDebugOptions> = {
    console: true,
    logValues: true,
    logValidation: true,
    logTouched: false,
    prefix: '[Zignal]',
    grouped: true,
};

/**
 * TR: Form state'ini debug modunda izler.
 * EN: Watches form state in debug mode.
 *
 * @example
 * ```typescript
 * const form = schema.createForm(initialValues);
 *
 * // Development ortamında debug aç
 * if (!environment.production) {
 *     enableFormDebug(form, { logTouched: true });
 * }
 * ```
 */
export function enableFormDebug<T extends Record<string, unknown>>(
    formState: {
        fields: { [K in keyof T]: { value: Signal<T[K]>; error: Signal<string | null>; touched: Signal<boolean>; valid: Signal<boolean> } };
        values: Signal<T>;
        valid: Signal<boolean>;
    },
    options: ZignalDebugOptions = {}
): () => void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cleanups: (() => void)[] = [];

    if (!opts.console) {
        return () => {};
    }

    // Form values değişikliği
    if (opts.logValues) {
        const valuesEffect = effect(() => {
            const values = formState.values();
            const isValid = formState.valid();

            if (opts.grouped) {
                console.groupCollapsed(`${opts.prefix} Form Updated`);
                console.log('Values:', values);
                console.log('Valid:', isValid);
                console.groupEnd();
            } else {
                console.log(`${opts.prefix} Values:`, values, `| Valid: ${isValid}`);
            }
        });
        cleanups.push(() => valuesEffect.destroy());
    }

    // Field-level debugging
    for (const [fieldName, fieldValue] of Object.entries(formState.fields)) {
        const fv = fieldValue as { value: Signal<unknown>; error: Signal<string | null>; touched: Signal<boolean>; valid: Signal<boolean> };

        if (opts.logValidation) {
            const validationEffect = effect(() => {
                const value = fv.value();
                const error = fv.error();
                const valid = fv.valid();

                if (error !== null) {
                    console.warn(`${opts.prefix} ${fieldName}: "${value}" → ❌ ${error}`);
                } else if (!valid) {
                    console.log(`${opts.prefix} ${fieldName}: "${value}" → ⚠️ Invalid (not touched)`);
                }
            });
            cleanups.push(() => validationEffect.destroy());
        }

        if (opts.logTouched) {
            const touchedEffect = effect(() => {
                const touched = fv.touched();
                if (touched) {
                    console.log(`${opts.prefix} ${fieldName}: touched`);
                }
            });
            cleanups.push(() => touchedEffect.destroy());
        }
    }

    // Cleanup function
    return () => {
        cleanups.forEach(cleanup => cleanup());
        console.log(`${opts.prefix} Debug disabled`);
    };
}

/**
 * TR: Zignal hatalarını daha açıklayıcı hale getirir.
 * EN: Makes Zignal errors more descriptive.
 */
export class ZignalError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(formatErrorMessage(code, message, context));
        this.name = 'ZignalError';
    }
}

function formatErrorMessage(
    code: string,
    message: string,
    context?: Record<string, unknown>
): string {
    let formatted = `[Zignal:${code}] ${message}`;

    if (context) {
        const contextStr = Object.entries(context)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(', ');
        formatted += ` (${contextStr})`;
    }

    return formatted;
}

/**
 * TR: Field bulunamadı hatası.
 * EN: Field not found error.
 */
export function fieldNotFoundError(
    fieldName: string,
    availableFields: string[]
): ZignalError {
    return new ZignalError(
        'FIELD_NOT_FOUND',
        `Field "${fieldName}" not found in schema. Available fields: ${availableFields.join(', ')}`,
        { fieldName, availableFields }
    );
}

/**
 * TR: Geçersiz field tipi hatası.
 * EN: Invalid field type error.
 */
export function invalidFieldTypeError(
    fieldType: string,
    registeredTypes: string[]
): ZignalError {
    return new ZignalError(
        'INVALID_FIELD_TYPE',
        `Field type "${fieldType}" is not registered. Registered types: ${registeredTypes.join(', ')}`,
        { fieldType, registeredTypes }
    );
}

/**
 * TR: Form submit hatası.
 * EN: Form submit error.
 */
export function formSubmitError(
    errors: Record<string, string | null>
): ZignalError {
    const invalidFields = Object.entries(errors)
        .filter(([, err]) => err !== null)
        .map(([field, err]) => `${field}: ${err}`);

    return new ZignalError(
        'FORM_INVALID',
        `Form is invalid. ${invalidFields.length} field(s) have errors.`,
        { errors, invalidFields }
    );
}
