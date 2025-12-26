import {computed, signal, Signal} from '@angular/core';
import {z} from 'zod';
import {FieldValue, IField} from "./interfaces";
import {parseExpression} from "./expression-parser";

/**
 * @fileoverview
 * TR: Form durumu (state) yönetimi için temel sınıf ve interface'ler.
 * Angular Signals kullanarak reaktif form state yönetimi sağlar.
 *
 * EN: Base class and interfaces for form state management.
 * Provides reactive form state management using Angular Signals.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Type Definitions
// EN: Type Definitions
// =============================================================================

/**
 * TR: Form veri yapısı için esnek constraint.
 * Interface'lerin [key: string]: unknown gerektirmesini önler.
 *
 * EN: Flexible constraint for form data structure.
 * Prevents interfaces from requiring [key: string]: unknown.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormDataType = Record<string, any>;

// =============================================================================
// TR: Interfaces - Aray�zler
// EN: Interfaces
// =============================================================================

/**
 * TR: Form'un anlık durumunu (state) ve y�netim metodlarını barındıran aray�z.
 * Angular Signals tabanlıdır; form dei_iklikleri anında ve performanslı _ekilde
 * UI'a yansır (fine-grained reactivity).
 *
 * EN: Interface holding the form's instant state and management methods.
 * Based on Angular Signals; form changes are reflected to UI instantly
 * and performantly (fine-grained reactivity).
 *
 * @template T - TR: Form verisinin tipi / EN: Type of form data
 *
 * @example
 * ```typescript
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * const form: FormState<LoginForm> = schema.createForm({
 *   email: '',
 *   password: ''
 * });
 *
 * // Reaktif state okuma
 * console.log(form.values());        // { email: '', password: '' }
 * console.log(form.valid());         // false
 *
 * // Deer g�ncelleme
 * form.setValue('email', 'test@example.com');
 *
 * // Submit �ncesi
 * const isValid = await form.validateAll();
 * if (isValid) {
 *   const data = form.getValues();
 *   // API'ye g�nder
 * }
 * ```
 */
export interface FormState<T extends FormDataType> {
    /**
     * TR: Her alan i�in reaktif state (FieldValue) tutan nesne haritası.
     * Alan adına g�re eri_im salar.
     *
     * EN: Object map holding reactive state (FieldValue) for each field.
     * Provides access by field name.
     *
     * @example
     * ```typescript
     * form.fields.email.value();      // Mevcut deer
     * form.fields.email.error();      // Hata mesajı (null ise hata yok)
     * form.fields.email.touched();    // Kullanıcı dokundu mu?
     * form.fields.email.valid();      // Ge�erli mi?
     * ```
     */
    fields: { [K in keyof T]: FieldValue<T[K]> };

    /**
     * TR: T�m form deerlerini tek nesne olarak d�nd�ren computed signal.
     * Herhangi bir alan dei_tiinde otomatik g�ncellenir.
     *
     * EN: Computed signal returning all form values as single object.
     * Automatically updates when any field changes.
     */
    values: Signal<T>;

    /**
     * TR: Form'un ba_langı� deerlerini tutan signal.
     * reset() �arıldıında bu deerlere d�n�l�r.
     *
     * EN: Signal holding initial values of the form.
     * Form returns to these values when reset() is called.
     */
    initialValues: Signal<T>;

    /**
     * TR: Form'un genel ge�erlilik durumu.
     * T�m alanlar ge�erliyse `true`, en az bir hata varsa `false`.
     *
     * EN: Overall validity status of the form.
     * `true` if all fields valid, `false` if at least one error.
     */
    valid: Signal<boolean>;

    /**
     * TR: Alan bazlı hata mesajlarını i�eren signal.
     *
     * EN: Signal containing field-based error messages.
     *
     * @example { email: "Ge�ersiz format", password: null }
     */
    errors: Signal<Partial<Record<keyof T, string | null>>>;

    /**
     * TR: Form'un "kirli" olup olmadıı - ba_langı� deerinden farklı mı?
     *
     * EN: Whether form is "dirty" - different from initial values?
     */
    dirty: Signal<boolean>;

    /**
     * TR: Form'un "temiz" olup olmadıı - hi�bir alana dokunulmadı mı?
     *
     * EN: Whether form is "pristine" - no field has been touched?
     */
    pristine: Signal<boolean>;

    /**
     * TR: T�m alanları "dokunulmu_" olarak i_aretler.
     * Submit �ncesi t�m hataları g�stermek i�in kullanılır.
     *
     * EN: Marks all fields as "touched".
     * Used to show all errors before submit.
     */
    touchAll: () => void;

    /**
     * TR: Formu ba_langı� deerlerine sıfırlar.
     * Yeni ba_langı� deerleri verilebilir.
     *
     * EN: Resets form to initial values.
     * New initial values can be provided.
     *
     * @param newInitial - TR: Yeni ba_langı� deerleri (opsiyonel)
     *                     EN: New initial values (optional)
     */
    reset: (newInitial?: Partial<T>) => void;

    /**
     * TR: Belirli bir alanın deerini g�nceller.
     *
     * EN: Updates value of specific field.
     *
     * @param name - TR: Alan adı / EN: Field name
     * @param value - TR: Yeni deer / EN: New value
     */
    setValue: <K extends keyof T>(name: K, value: T[K]) => void;

    /**
     * TR: Birden fazla alan deerini tek seferde g�nceller.
     *
     * EN: Updates multiple field values at once.
     *
     * @param values - TR: G�ncellenecek deerler / EN: Values to update
     */
    patchValues: (values: Partial<T>) => void;

    /**
     * TR: Zod _emasından ge�irilmi_, type-safe form deerlerini d�nd�r�r.
     *
     * EN: Returns type-safe form values passed through Zod schema.
     *
     * @throws TR: Form ge�ersizse Zod hatası fırlatır
     *         EN: Throws Zod error if form is invalid
     */
    getValues: () => T;

    /**
     * TR: Sadece dei_en (dirty) alanların deerlerini d�nd�r�r.
     * Patch update API'leri i�in kullanı_lıdır.
     *
     * EN: Returns only values of changed (dirty) fields.
     * Useful for patch update APIs.
     */
    getDirtyValues: () => Partial<T>;

    /**
     * TR: T�m alanları validate eder ve sonucu d�ner.
     * Submit �ncesi �arılmalıdır.
     *
     * EN: Validates all fields and returns result.
     * Should be called before submit.
     *
     * @returns TR: Form ge�erli ise true / EN: True if form is valid
     */
    validateAll: () => Promise<boolean>;

    /**
     * TR: Belirli bir alanı dirty olarak i_aretler.
     *
     * EN: Marks specific field as dirty.
     *
     * @param name - TR: Alan adı / EN: Field name
     */
    markDirty: (name: keyof T) => void;

    /**
     * TR: T�m alanları touched=false yapar.
     *
     * EN: Sets touched=false for all fields.
     */
    markPristine: () => void;

    /**
     * TR: Cross-field validation hataları.
     * Alan bazlı değil, form genelinde validasyon hataları.
     *
     * EN: Cross-field validation errors.
     * Form-wide validation errors, not field-specific.
     *
     * @example { passwordMatch: "Şifreler eşleşmiyor" }
     */
    crossErrors: Signal<Record<string, string | null>>;

    /**
     * TR: Sadece belirli alanları validate eder.
     * Wizard/multi-step formlar için kullanışlı.
     *
     * EN: Validates only specific fields.
     * Useful for wizard/multi-step forms.
     *
     * @param fieldNames - TR: Validate edilecek alan isimleri
     *                     EN: Field names to validate
     * @returns TR: Belirtilen alanlar geçerli mi
     *          EN: Whether specified fields are valid
     */
    validateFields: (fieldNames: (keyof T)[]) => boolean;

    /**
     * TR: Belirli bir alanı sıfırlar.
     *
     * EN: Resets a specific field.
     *
     * @param name - TR: Sıfırlanacak alan adı
     *               EN: Field name to reset
     */
    resetField: (name: keyof T) => void;

    /**
     * TR: Hangi alanların değiştiğini döner.
     *
     * EN: Returns which fields have changed.
     *
     * @returns TR: Değişen alan isimleri
     *          EN: Names of changed fields
     */
    dirtyFields: Signal<(keyof T)[]>;

    /**
     * TR: Form değerlerini JSON olarak export eder.
     * Transform ve exclude desteği ile.
     *
     * EN: Exports form values as JSON.
     * With transform and exclude support.
     */
    toJSON: (options?: FormExportOptions<T>) => Record<string, unknown>;

    /**
     * TR: Belirli bir alanın dirty olup olmadığını kontrol eder.
     *
     * EN: Checks if a specific field is dirty.
     */
    isFieldDirty: (name: keyof T) => boolean;
}

// =============================================================================
// TR: Utility Functions - Yardımcı Fonksiyonlar
// EN: Utility Functions
// =============================================================================

class BoundedCache<K extends object, V> {
    private cache = new WeakMap<K, V>();
    private keys: K[] = [];
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        return this.cache.get(key);
    }

    set(key: K, value: V): void {
        if (!this.cache.has(key)) {
            this.keys.push(key);
            if (this.keys.length > this.maxSize) {
                const oldKey = this.keys.shift();
                if (oldKey) this.cache.delete(oldKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.keys = [];
        this.cache = new WeakMap();
    }
}

const globalVisitedCache = new BoundedCache<object, WeakMap<object, boolean>>(500);


/**
 * TR: 0ki deerin derin e_itliini kontrol eder.
 * Circular reference koruması ile stack overflow'u �nler.
 *
 * EN: Checks deep equality of two values.
 * Prevents stack overflow with circular reference protection.
 *
 * @param a - TR: 0lk deer / EN: First value
 * @param b - TR: 0kinci deer / EN: Second value
 * @returns TR: E_itse true / EN: True if equal
 *
 * @internal
 */
function deepEqual(a: unknown, b: unknown, maxDepth = 50): boolean {
    // Depth protection
    if (maxDepth <= 0) return false;

    // Primitive checks
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    // Circular reference protection with bounded cache
    let visitedForA = globalVisitedCache.get(objA);
    if (!visitedForA) {
        visitedForA = new WeakMap();
        globalVisitedCache.set(objA, visitedForA);
    }

    if (visitedForA.has(objB)) {
        return visitedForA.get(objB)!;
    }
    visitedForA.set(objB, true);

    // Array check
    if (Array.isArray(objA) !== Array.isArray(objB)) return false;

    if (Array.isArray(objA) && Array.isArray(objB)) {
        if (objA.length !== objB.length) return false;
        return objA.every((val, idx) => deepEqual(val, objB[idx], maxDepth - 1));
    }

    // Object comparison
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key =>
        Object.prototype.hasOwnProperty.call(objB, key) &&
        deepEqual(objA[key], objB[key], maxDepth - 1)
    );
}


// =============================================================================
// TR: Cross-Field Validation Types
// EN: Cross-Field Validation Types
// =============================================================================

/**
 * TR: Cross-field validator tanımı.
 * Birden fazla alanı kontrol eden validasyon kuralları.
 *
 * EN: Cross-field validator definition.
 * Validation rules that check multiple fields.
 */
export interface CrossFieldValidator<T extends FormDataType> {
    /**
     * TR: Validator'ın benzersiz adı.
     * EN: Unique name of the validator.
     */
    name: string;

    /**
     * TR: Bu validator'ın bağlı olduğu alanlar.
     * EN: Fields this validator depends on.
     */
    fields: (keyof T)[];

    /**
     * TR: Validasyon fonksiyonu. Hata mesajı döner veya null (geçerli).
     * EN: Validation function. Returns error message or null (valid).
     */
    validate: (values: T) => string | null;
}

/**
 * TR: FormSchema için yapılandırma seçenekleri.
 * EN: Configuration options for FormSchema.
 */
export interface FormSchemaOptions<T extends FormDataType> {
    /**
     * TR: Cross-field validator'lar.
     * EN: Cross-field validators.
     *
     * @example
     * ```typescript
     * crossValidators: [
     *   {
     *     name: 'passwordMatch',
     *     fields: ['password', 'confirmPassword'],
     *     validate: (values) =>
     *       values.password !== values.confirmPassword
     *         ? 'Şifreler eşleşmiyor'
     *         : null
     *   }
     * ]
     * ```
     */
    crossValidators?: CrossFieldValidator<T>[];

    /**
     * TR: Debug modu aktif mi?
     * EN: Is debug mode active?
     * @default false
     */
    debug?: boolean;

    /**
     * TR: Validation debounce süresi (ms).
     * EN: Validation debounce time (ms).
     * @default 0 (no debounce)
     */
    validationDebounce?: number;
}

/**
 * TR: Form export seçenekleri.
 * EN: Form export options.
 */
export interface FormExportOptions<T> {
    /**
     * TR: Export'tan hariç tutulacak alanlar.
     * EN: Fields to exclude from export.
     */
    excludeFields?: (keyof T)[];

    /**
     * TR: Alan bazlı transform fonksiyonları.
     * EN: Field-level transform functions.
     */
    transform?: Partial<{ [K in keyof T]: (value: T[K]) => unknown }>;

    /**
     * TR: Sadece dirty alanları export et.
     * EN: Export only dirty fields.
     * @default false
     */
    onlyDirty?: boolean;

    /**
     * TR: null değerleri dahil et.
     * EN: Include null values.
     * @default true
     */
    includeNull?: boolean;
}

// =============================================================================
// TR: FormSchema Class
// EN: FormSchema Class
// =============================================================================

/**
 * TR: Form yapısını tanımlayan, y�neten ve �alı_ma zamanında in_a eden ana sınıf.
 * Baımsız Field tanımlarını birle_tirir, merkezi Zod validasyon _eması olu_turur
 * ve reaktif FormState ba_latır.
 *
 * EN: Main class that defines, manages, and builds form structure at runtime.
 * Combines independent Field definitions, creates central Zod validation schema,
 * and initializes reactive FormState.
 *
 * @template T - TR: Form'un veri yapısı / EN: Data structure of the form
 *
 * @example
 * ```typescript
 * // ı. Field'ları tanımla
 * const emailField = new StringField('email', 'E-posta', {
 *   required: true,
 *   email: true
 * });
 *
 * const passwordField = new StringField('password', '^ifre', {
 *   required: true,
 *   minLength: 8
 * });
 *
 * // 2. Schema olu_tur
 * const loginSchema = new FormSchema<LoginForm>([emailField, passwordField]);
 *
 * // 3. Form state olu_tur
 * const form = loginSchema.createForm({ email: '', password: '' });
 *
 * // 4. Component'te kullan
 * form.fields.email.value.set(inputValue);
 * form.fields.email.touched.set(true);
 *
 * if (await form.validateAll()) {
 *   const data = form.getValues();
 *   // Submit
 * }
 * ```
 */
export class FormSchema<T extends FormDataType> {
    /**
     * TR: Alan adı -> IField mapping i�in hızlı eri_im Map'i.
     *
     * EN: Quick access Map for field name -> IField mapping.
     *
     * @private
     */
    private readonly fieldMap: Map<string, IField<unknown>>;

    /**
     * TR: T�m alanların birle_ik Zod object _eması.
     *
     * EN: Combined Zod object schema of all fields.
     *
     * @private
     */
    private readonly zodSchema: z.ZodObject<z.ZodRawShape>;

    /**
     * TR: Cross-field validator'lar.
     * EN: Cross-field validators.
     * @private
     */
    private readonly crossValidators: CrossFieldValidator<T>[];

    /**
     * TR: FormSchema constructor'ı.
     *
     * EN: FormSchema constructor.
     *
     * @param fields - TR: Formu olu_turacak alan listesi. Her alan IField interface'ini
     *                 implemente etmelidir. Alan sırası UI'da korunur.
     *                 EN: List of fields to create the form. Each field must implement
     *                 IField interface. Field order is preserved in UI.
     *
     * @param options
     * @example
     * ```typescript
     * const schema = new FormSchema([
     *   new StringField('name', 'Ad'),
     *   new NumberField('age', 'Ya_'),
     *   new DateField('birthDate', 'Doum Tarihi')
     * ]);
     * ```
     */
    constructor(
        private readonly fields: IField<unknown>[],
        private readonly options: FormSchemaOptions<T> = {}
    ) {
        // TR: Hızlı eri_im için Map oluştur
        // EN: Create Map for quick access
        this.fieldMap = new Map(fields.map((f) => [f.name, f]));
        this.zodSchema = this.buildZodSchema();
        this.crossValidators = this.options.crossValidators ?? [];
    }

    /**
     * TR: T�m alanların bireysel _emalarını birle_tirerek tek Zod Object _eması olu_turur.
     *
     * EN: Creates single Zod Object schema by combining individual schemas of all fields.
     *
     * @returns TR: Birle_ik Zod object _eması
     *          EN: Combined Zod object schema
     *
     * @private
     */
    private buildZodSchema(): z.ZodObject<z.ZodRawShape> {
        const shape: z.ZodRawShape = {};
        for (const field of this.fields) {
            shape[field.name] = field.schema();
        }
        return z.object(shape);
    }

    /**
     * TR: Tanımlanan _emaya g�re yeni reaktif form state (FormState) olu_turur.
     * Her �arıda baımsız yeni bir state instance'ı d�ner.
     *
     * EN: Creates new reactive form state (FormState) based on defined schema.
     * Returns independent new state instance on each call.
     *
     * @param initial - TR: Form'un ba_langı� deerleri. Belirtilmeyen alanlar null olur.
     *                  EN: Initial values of the form. Unspecified fields become null.
     *
     * @returns TR: Y�netilebilir reaktif form state nesnesi
     *          EN: Manageable reactive form state object
     *
     * @example
     * ```typescript
     * // Bo_ form
     * const emptyForm = schema.createForm();
     *
     * // Ba_langı� deerleri ile
     * const filledForm = schema.createForm({
     *   email: 'user@example.com',
     *   name: 'John Doe'
     * });
     *
     * // Edit formu (API'den gelen veri ile)
     * const editForm = schema.createForm(existingData);
     * ```
     */
    createForm(initial: Partial<T> = {}): FormState<T> {
        // TR: Başlangıç değerlerini sakla
        // EN: Store initial values
        const initialValues = signal<T>({...initial} as T);

        // TR: Her alan için FieldValue oluştur
        // EN: Create FieldValue for each field
        const fieldEntries = this.fields.map((field) => {
            const initValue = initial[field.name as keyof T] ?? null;
            return [field.name, field.createValue(initValue)] as const;
        });

        const formFields = Object.fromEntries(fieldEntries) as FormState<T>['fields'];

        // TR: Başlangıç değerlerini her alan için sakla (dirty hesaplaması için)
        // EN: Store initial values for each field (for dirty calculation)
        const initialFieldValues = new Map<string, unknown>();
        for (const [name, fv] of Object.entries(formFields)) {
            initialFieldValues.set(name, (fv as FieldValue<unknown>).value());
        }

        // =========================================================================
        // TR: Computed Signals
        // EN: Computed Signals
        // =========================================================================

        /**
         * TR: Tüm form değerlerini döndüren computed signal.
         * EN: Computed signal returning all form values.
         */
        const values = computed(() => {
            const result: Record<string, unknown> = {};
            for (const [name, fv] of Object.entries(formFields)) {
                result[name] = (fv as FieldValue<unknown>).value();
            }
            return result as T;
        });

        // =========================================================================
        // TR: hideExpression ve disableExpression
        // EN: hideExpression and disableExpression
        // =========================================================================
        for (const field of this.fields) {
            const fv = formFields[field.name as keyof T] as FieldValue<unknown>;

            if (field.config.hideExpression) {
                const parsedHide = parseExpression(field.config.hideExpression);
                (fv as any).hidden = computed(() => parsedHide(values()));
            } else {
                (fv as any).hidden = computed(() => false);
            }

            if (field.config.disableExpression) {
                const parsedDisable = parseExpression(field.config.disableExpression);
                (fv as any).disabled = computed(() => parsedDisable(values()));
            } else {
                (fv as any).disabled = computed(() => false);
            }
        }

        /**
         * TR: Tüm hataları toplayan computed signal.
         * EN: Computed signal collecting all errors.
         */
        const errors = computed(() => {
            const result: Partial<Record<keyof T, string | null>> = {};
            for (const [name, fv] of Object.entries(formFields)) {
                result[name as keyof T] = (fv as FieldValue<unknown>).error();
            }
            return result;
        });

        /**
         * TR: Cross-field validation hataları.
         * EN: Cross-field validation errors.
         */
        const crossErrors = computed(() => {
            const result: Record<string, string | null> = {};
            const currentValues = values();

            for (const validator of this.crossValidators) {
                result[validator.name] = validator.validate(currentValues);
            }

            return result;
        });

        /**
         * TR: Genel geçerlilik durumu (cross-field dahil).
         * EN: Overall validity status (including cross-field).
         */
        const valid = computed(() => {
            // TR: Alan bazlı validasyon
            // EN: Field-level validation
            const fieldsValid = Object.values(formFields).every(
                (fv) => (fv as FieldValue<unknown>).valid()
            );

            // TR: Cross-field validasyon
            // EN: Cross-field validation
            const crossValid = Object.values(crossErrors()).every(err => err === null);

            return fieldsValid && crossValid;
        });

        /**
         * TR: Dirty durumu - herhangi bir alan değişti mi?
         * EN: Dirty status - has any field changed?
         */
        const dirty = computed(() => {
            for (const [name, fv] of Object.entries(formFields)) {
                const current = (fv as FieldValue<unknown>).value();
                const initial = initialFieldValues.get(name);
                if (!deepEqual(current, initial)) {
                    return true;
                }
            }
            return false;
        });

        /**
         * TR: Pristine durumu - hiçbir alana dokunulmadı mı?
         * EN: Pristine status - no field has been touched?
         */
        const pristine = computed(() => {
            return Object.values(formFields).every(
                (fv) => !(fv as FieldValue<unknown>).touched()
            );
        });

        // =========================================================================
        // TR: Action Methods - Aksiyon Metodları
        // EN: Action Methods
        // =========================================================================

        /**
         * TR: T�m alanları touched yap.
         * EN: Mark all fields as touched.
         */
        const touchAll = (): void => {
            for (const fv of Object.values(formFields)) {
                (fv as FieldValue<unknown>).touched.set(true);
            }
        };

        /**
         * TR: Formu sıfırla.
         * EN: Reset the form.
         */
        const reset = (newInitial?: Partial<T>): void => {
            const resetValues = newInitial ?? initialValues();
            initialValues.set({...resetValues} as T);

            for (const [name, fv] of Object.entries(formFields)) {
                const val = resetValues[name as keyof T] ?? null;
                (fv as FieldValue<unknown>).value.set(val);
                (fv as FieldValue<unknown>).touched.set(false);
                initialFieldValues.set(name, val);
            }
        };

        /**
         * TR: Tek alan deeri g�ncelle.
         * EN: Update single field value.
         */
        const setValue = <K extends keyof T>(name: K, value: T[K]): void => {
            const fv = formFields[name];
            if (fv) {
                fv.value.set(value);
            }
        };

        /**
         * TR: Birden fazla alan deeri g�ncelle.
         * EN: Update multiple field values.
         */
        const patchValues = (vals: Partial<T>): void => {
            for (const [name, value] of Object.entries(vals)) {
                setValue(name as keyof T, value as T[keyof T]);
            }
        };

        /**
         * TR: Validasyondan ge�mi_ deerleri al.
         * EN: Get validated values.
         */
        const getValues = (): T => {
            return this.zodSchema.parse(values()) as T;
        };

        /**
         * TR: Sadece dei_en alanların deerlerini al.
         * EN: Get only changed field values.
         */
        const getDirtyValues = (): Partial<T> => {
            const result: Partial<T> = {};
            for (const [name, fv] of Object.entries(formFields)) {
                const current = (fv as FieldValue<unknown>).value();
                const initial = initialFieldValues.get(name);
                if (!deepEqual(current, initial)) {
                    result[name as keyof T] = current as T[keyof T];
                }
            }
            return result;
        };

        /**
         * TR: T�m alanları validate et.
         * EN: Validate all fields.
         */
        const validateAll = async (): Promise<boolean> => {
            touchAll();
            const result = await this.zodSchema.safeParseAsync(values());
            return result.success;
        };

        /**
         * TR: Belirli alanı dirty olarak i_aretle.
         * EN: Mark specific field as dirty.
         */
        const markDirty = (name: keyof T): void => {
            const fv = formFields[name];
            if (fv) {
                fv.touched.set(true);
            }
        };

        /**
         * TR: T�m alanları pristine yap.
         * EN: Mark all fields as pristine.
         */
        const markPristine = (): void => {
            for (const fv of Object.values(formFields)) {
                (fv as FieldValue<unknown>).touched.set(false);
            }
        };

        /**
         * TR: Sadece belirli alanları validate et.
         * EN: Validate only specific fields.
         */
        const validateFields = (fieldNames: (keyof T)[]): boolean => {
            let allValid = true;

            for (const name of fieldNames) {
                const fv = formFields[name];
                if (fv) {
                    fv.touched.set(true);
                    if (!fv.valid()) {
                        allValid = false;
                    }
                }
            }

            return allValid;
        };

        /**
         * TR: Belirli bir alanı sıfırla.
         * EN: Reset a specific field.
         */
        const resetField = (name: keyof T): void => {
            const fv = formFields[name];
            if (fv) {
                const initialVal = initialFieldValues.get(name as string) ?? null;
                fv.value.set(initialVal as T[keyof T]);
                fv.touched.set(false);
            }
        };

        /**
         * TR: Değişen alanların listesi.
         * EN: List of changed fields.
         */
        const dirtyFields = computed(() => {
            const result: (keyof T)[] = [];

            for (const [name, fv] of Object.entries(formFields)) {
                const current = (fv as FieldValue<unknown>).value();
                const initial = initialFieldValues.get(name);
                if (!deepEqual(current, initial)) {
                    result.push(name as keyof T);
                }
            }

            return result;
        });

        /**
         * TR: Belirli bir alan dirty mi?
         * EN: Is a specific field dirty?
         */
        const isFieldDirty = (name: keyof T): boolean => {
            const fv = formFields[name];
            if (!fv) return false;

            const current = fv.value();
            const initial = initialFieldValues.get(name as string);
            return !deepEqual(current, initial);
        };

        /**
         * TR: Form değerlerini JSON olarak export et.
         * EN: Export form values as JSON.
         */
        const toJSON = (options: FormExportOptions<T> = {}): Record<string, unknown> => {
            const {
                excludeFields = [],
                onlyDirty = false,
                includeNull = true,
            } = options;

            const transform: FormExportOptions<T>['transform'] = options.transform ?? {};

            const result: Record<string, unknown> = {};
            const sourceValues = onlyDirty ? getDirtyValues() : values();

            for (const [name, value] of Object.entries(sourceValues)) {
                // Exclude kontrolü
                if (excludeFields.includes(name as keyof T)) {
                    continue;
                }

                // Null kontrolü
                if (!includeNull && value === null) {
                    continue;
                }

                // Transform kontrolü
                const transformFn = transform[name as keyof T];
                if (transformFn) {
                    result[name] = transformFn(value as T[keyof T]);
                } else {
                    result[name] = value;
                }
            }

            return result;
        };

        return {
            fields: formFields,
            values,
            initialValues,
            valid,
            errors,
            crossErrors,
            dirty,
            pristine,
            touchAll,
            reset,
            setValue,
            patchValues,
            getValues,
            getDirtyValues,
            validateAll,
            markDirty,
            markPristine,
            validateFields,
            resetField,
            dirtyFields,
            isFieldDirty,
            toJSON,
        };
    }

    // ===========================================================================
    // TR: Schema Utility Methods - ^ema Yardımcı Metodları
    // EN: Schema Utility Methods
    // ===========================================================================

    /**
     * TR: 0sme g�re alan (Field) tanımını d�nd�r�r.
     *
     * EN: Returns field definition by name.
     *
     * @param name - TR: Alan adı / EN: Field name
     * @returns TR: Field veya undefined / EN: Field or undefined
     *
     * @example
     * ```typescript
     * const emailField = schema.getField('email');
     * if (emailField) {
     *   console.log(emailField.label); // "E-posta"
     * }
     * ```
     */
    getField(name: string): IField<unknown> | undefined {
        return this.fieldMap.get(name);
    }

    /**
     * TR: T�m alan listesini d�nd�r�r.
     *
     * EN: Returns list of all fields.
     *
     * @returns TR: Field dizisi / EN: Array of fields
     */
    getFields(): IField<unknown>[] {
        return this.fields;
    }

    /**
     * TR: T�m alan etiketlerini d�nd�r�r.
     * CSV/Excel export ba_lıkları i�in kullanı_lıdır.
     *
     * EN: Returns all field labels.
     * Useful for CSV/Excel export headers.
     *
     * @returns TR: Etiket dizisi / EN: Array of labels
     */
    getLabels(): string[] {
        return this.fields.map((f) => f.label);
    }

    /**
     * TR: T�m alan adlarını d�nd�r�r.
     *
     * EN: Returns all field names.
     *
     * @returns TR: Alan adı dizisi / EN: Array of field names
     */
    getNames(): string[] {
        return this.fields.map((f) => f.name);
    }

    /**
     * TR: Birle_ik Zod _emasını d�nd�r�r.
     * 0leri seviye validasyon veya tip �ıkarımı i�in kullanılabilir.
     *
     * EN: Returns combined Zod schema.
     * Can be used for advanced validation or type inference.
     *
     * @returns TR: Zod object _eması / EN: Zod object schema
     */
    getZodSchema(): z.ZodObject<z.ZodRawShape> {
        return this.zodSchema;
    }
}

// =============================================================================
// TR: Factory Function - Fabrika Fonksiyonu
// EN: Factory Function
// =============================================================================

/**
 * TR: FormSchema olu_turmak i�in kısa yol fonksiyonu.
 *
 * EN: Shortcut function to create FormSchema.
 *
 * @param fields - TR: Alan listesi / EN: List of fields
 * @returns TR: FormSchema instance / EN: FormSchema instance
 *
 * @example
 * ```typescript
 * const schema = createFormSchema([
 *   new StringField('email', 'E-posta', { required: true, email: true }),
 *   new StringField('password', '^ifre', { required: true, minLength: 8 })
 * ]);
 *
 * const form = schema.createForm();
 * ```
 */
export function createFormSchema<T extends FormDataType>(
    fields: IField<unknown>[]
): FormSchema<T> {
    return new FormSchema<T>(fields);
}


