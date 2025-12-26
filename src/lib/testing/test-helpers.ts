import { signal, computed } from '@angular/core';
import { IField, FieldValue, FieldConfig } from '../core/interfaces';
import {StringField, StringFieldConfig} from '../fields/string.field';
import {NumberField, NumberFieldConfig} from '../fields/number.field';
import {BooleanField, BooleanFieldConfig} from '../fields/boolean.field';
import { DateField } from '../fields/date.field';
import { SelectField } from '../fields/select.field';
import { FormSchema, FormDataType } from '../core/form-state';

/**
 * @fileoverview
 * TR: Zignal test helpers.
 * Unit testlerde form ve field oluşturmayı kolaylaştırır.
 *
 * EN: Zignal test helpers.
 * Simplifies form and field creation in unit tests.
 */

// =============================================================================
// Field Test Helpers
// =============================================================================

export type TestFieldType = 'string' | 'number' | 'boolean' | 'date' | 'select';

/**
 * TR: Test için hızlı field oluşturur.
 * EN: Creates quick field for testing.
 *
 * @example
 * ```typescript
 * const field = createTestField('string', { required: true, minLength: 3 });
 * const state = field.createValue('test');
 * expect(state.valid()).toBe(true);
 * ```
 */
export function createTestField<T = unknown>(
    type: TestFieldType,
    config: FieldConfig = {},
    name = 'testField',
    label = 'Test Field'
): IField<T> {
    switch (type) {
        case 'string':
            return new StringField(name, label, config as StringFieldConfig) as unknown as IField<T>;
        case 'number':
            return new NumberField(name, label, config as NumberFieldConfig) as unknown as IField<T>;
        case 'boolean':
            return new BooleanField(name, label, config as BooleanFieldConfig) as unknown as IField<T>;
        case 'date':
            return new DateField(name, label, config) as unknown as IField<T>;
        case 'select':
            return new SelectField(name, label, {
                ...config,
                options: (config as any).options ?? [
                    { value: 'a', label: 'Option A' },
                    { value: 'b', label: 'Option B' },
                ],
            }) as unknown as IField<T>;
        default:
            throw new Error(`Unknown field type: ${type}`);
    }
}

/**
 * TR: Test için field state oluşturur ve yardımcı metodlar sağlar.
 * EN: Creates field state for testing with helper methods.
 *
 * @example
 * ```typescript
 * const { state, setValue, setTouched, expectValid, expectError } = createTestFieldState('string', { required: true });
 *
 * setValue('');
 * setTouched();
 * expectError('Bu alan zorunludur');
 *
 * setValue('hello');
 * expectValid();
 * ```
 */
export function createTestFieldState<T = unknown>(
    type: TestFieldType,
    config: FieldConfig = {},
    initialValue?: T
) {
    const field = createTestField<T>(type, config);
    const state = field.createValue(initialValue);

    return {
        field,
        state,

        /** TR: Değer ata / EN: Set value */
        setValue: (value: T) => {
            state.value.set(value);
        },

        /** TR: Touched yap / EN: Set touched */
        setTouched: (touched = true) => {
            state.touched.set(touched);
        },

        /** TR: Değer ata ve touched yap / EN: Set value and touch */
        setValueAndTouch: (value: T) => {
            state.value.set(value);
            state.touched.set(true);
        },

        /** TR: Valid bekle / EN: Expect valid */
        expectValid: () => {
            expect(state.valid()).toBe(true);
            expect(state.error()).toBeNull();
        },

        /** TR: Invalid bekle / EN: Expect invalid */
        expectInvalid: () => {
            expect(state.valid()).toBe(false);
        },

        /** TR: Belirli hata bekle / EN: Expect specific error */
        expectError: (expectedError: string) => {
            state.touched.set(true);
            expect(state.error()).toBe(expectedError);
        },

        /** TR: Hata içeriyor mu kontrol et / EN: Check error contains */
        expectErrorContains: (substring: string) => {
            state.touched.set(true);
            expect(state.error()).toContain(substring);
        },

        /** TR: Mevcut değeri al / EN: Get current value */
        getValue: () => state.value(),

        /** TR: Mevcut hatayı al / EN: Get current error */
        getError: () => state.error(),

        /** TR: Geçerli mi? / EN: Is valid? */
        isValid: () => state.valid(),
    };
}

// =============================================================================
// Form Test Helpers
// =============================================================================

/**
 * TR: Test için form oluşturur.
 * EN: Creates form for testing.
 *
 * @example
 * ```typescript
 * const { form, setValue, patchValues, expectValid, submit } = createTestForm({
 *     email: { type: 'string', config: { required: true, email: true } },
 *     age: { type: 'number', config: { min: 0, max: 150 } },
 * });
 *
 * patchValues({ email: 'test@example.com', age: 25 });
 * expectValid();
 *
 * const data = submit();
 * expect(data.email).toBe('test@example.com');
 * ```
 */
export function createTestForm<T extends FormDataType>(
    fieldDefinitions: {
        [K in keyof T]: {
            type: TestFieldType;
            config?: FieldConfig;
            label?: string;
        };
    },
    initialValues: Partial<T> = {}
) {
    // Field'ları oluştur
    const fields: IField<unknown>[] = [];

    for (const [name, def] of Object.entries(fieldDefinitions)) {
        const field = createTestField(
            def.type,
            def.config ?? {},
            name,
            def.label ?? name
        );
        fields.push(field);
    }

    // Schema ve form oluştur
    const schema = new FormSchema<T>(fields);
    const form = schema.createForm(initialValues);

    return {
        schema,
        form,

        /** TR: Tek değer ata / EN: Set single value */
        setValue: <K extends keyof T>(name: K, value: T[K]) => {
            form.setValue(name, value);
        },

        /** TR: Birden fazla değer ata / EN: Patch multiple values */
        patchValues: (values: Partial<T>) => {
            form.patchValues(values);
        },

        /** TR: Tüm alanları touch et / EN: Touch all fields */
        touchAll: () => {
            form.touchAll();
        },

        /** TR: Formu sıfırla / EN: Reset form */
        reset: (newInitial?: Partial<T>) => {
            form.reset(newInitial);
        },

        /** TR: Form valid bekle / EN: Expect form valid */
        expectValid: () => {
            expect(form.valid()).toBe(true);
        },

        /** TR: Form invalid bekle / EN: Expect form invalid */
        expectInvalid: () => {
            expect(form.valid()).toBe(false);
        },

        /** TR: Belirli alan hata bekle / EN: Expect field error */
        expectFieldError: (fieldName: keyof T, expectedError: string) => {
            form.fields[fieldName].touched.set(true);
            expect(form.fields[fieldName].error()).toBe(expectedError);
        },

        /** TR: Submit simülasyonu / EN: Simulate submit */
        submit: (): T | null => {
            form.touchAll();
            if (form.valid()) {
                return form.getValues();
            }
            return null;
        },

        /** TR: Async submit simülasyonu / EN: Simulate async submit */
        submitAsync: async (): Promise<T | null> => {
            const isValid = await form.validateAll();
            if (isValid) {
                return form.getValues();
            }
            return null;
        },

        /** TR: Form values al / EN: Get form values */
        getValues: () => form.values(),

        /** TR: Form errors al / EN: Get form errors */
        getErrors: () => form.errors(),

        /** TR: Form dirty mi? / EN: Is form dirty? */
        isDirty: () => form.dirty(),

        /** TR: Form pristine mi? / EN: Is form pristine? */
        isPristine: () => form.pristine(),
    };
}

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * TR: Mock FieldValue oluşturur.
 * EN: Creates mock FieldValue.
 */
export function createMockFieldValue<T>(
    initialValue: T,
    options: { valid?: boolean; error?: string | null } = {}
): FieldValue<T> {
    const value = signal<T>(initialValue);
    const touched = signal(false);
    const isValid = options.valid ?? true;
    const errorMsg = options.error ?? null;

    return {
        value,
        touched,
        valid: computed(() => isValid),
        error: computed(() => touched() ? errorMsg : null),
    };
}

/**
 * TR: Async validator mock'u oluşturur.
 * EN: Creates async validator mock.
 */
export function createMockAsyncValidator<T>(
    result: string | null,
    delay = 100
): (value: T) => Promise<string | null> {
    return async (_value: T) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return result;
    };
}
