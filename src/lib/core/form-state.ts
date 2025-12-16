import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';
import { IField, FieldValue } from '../fields';

/**
 * @fileoverview
 * TR: Form durumu (state) yönetimi için temel s1n1f ve interface'ler.
 * Angular Signals kullanarak reaktif form state yönetimi salar.
 *
 * EN: Base class and interfaces for form state management.
 * Provides reactive form state management using Angular Signals.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Interfaces - Arayüzler
// EN: Interfaces
// =============================================================================

/**
 * TR: Form'un anl1k durumunu (state) ve yönetim metodlar1n1 bar1nd1ran arayüz.
 * Angular Signals tabanl1d1r; form dei_iklikleri an1nda ve performansl1 _ekilde
 * UI'a yans1r (fine-grained reactivity).
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
 * // Deer güncelleme
 * form.setValue('email', 'test@example.com');
 *
 * // Submit öncesi
 * const isValid = await form.validateAll();
 * if (isValid) {
 *   const data = form.getValues();
 *   // API'ye gönder
 * }
 * ```
 */
export interface FormState<T extends Record<string, unknown>> {
  /**
   * TR: Her alan için reaktif state (FieldValue) tutan nesne haritas1.
   * Alan ad1na göre eri_im salar.
   *
   * EN: Object map holding reactive state (FieldValue) for each field.
   * Provides access by field name.
   *
   * @example
   * ```typescript
   * form.fields.email.value();      // Mevcut deer
   * form.fields.email.error();      // Hata mesaj1 (null ise hata yok)
   * form.fields.email.touched();    // Kullan1c1 dokundu mu?
   * form.fields.email.valid();      // Geçerli mi?
   * ```
   */
  fields: { [K in keyof T]: FieldValue<T[K]> };

  /**
   * TR: Tüm form deerlerini tek nesne olarak döndüren computed signal.
   * Herhangi bir alan dei_tiinde otomatik güncellenir.
   *
   * EN: Computed signal returning all form values as single object.
   * Automatically updates when any field changes.
   */
  values: Signal<T>;

  /**
   * TR: Form'un ba_lang1ç deerlerini tutan signal.
   * reset() çar1ld11nda bu deerlere dönülür.
   *
   * EN: Signal holding initial values of the form.
   * Form returns to these values when reset() is called.
   */
  initialValues: Signal<T>;

  /**
   * TR: Form'un genel geçerlilik durumu.
   * Tüm alanlar geçerliyse `true`, en az bir hata varsa `false`.
   *
   * EN: Overall validity status of the form.
   * `true` if all fields valid, `false` if at least one error.
   */
  valid: Signal<boolean>;

  /**
   * TR: Alan bazl1 hata mesajlar1n1 içeren signal.
   *
   * EN: Signal containing field-based error messages.
   *
   * @example { email: "Geçersiz format", password: null }
   */
  errors: Signal<Partial<Record<keyof T, string | null>>>;

  /**
   * TR: Form'un "kirli" olup olmad11 - ba_lang1ç deerinden farkl1 m1?
   *
   * EN: Whether form is "dirty" - different from initial values?
   */
  dirty: Signal<boolean>;

  /**
   * TR: Form'un "temiz" olup olmad11 - hiçbir alana dokunulmad1 m1?
   *
   * EN: Whether form is "pristine" - no field has been touched?
   */
  pristine: Signal<boolean>;

  /**
   * TR: Tüm alanlar1 "dokunulmu_" olarak i_aretler.
   * Submit öncesi tüm hatalar1 göstermek için kullan1l1r.
   *
   * EN: Marks all fields as "touched".
   * Used to show all errors before submit.
   */
  touchAll: () => void;

  /**
   * TR: Formu ba_lang1ç deerlerine s1f1rlar.
   * Yeni ba_lang1ç deerleri verilebilir.
   *
   * EN: Resets form to initial values.
   * New initial values can be provided.
   *
   * @param newInitial - TR: Yeni ba_lang1ç deerleri (opsiyonel)
   *                     EN: New initial values (optional)
   */
  reset: (newInitial?: Partial<T>) => void;

  /**
   * TR: Belirli bir alan1n deerini günceller.
   *
   * EN: Updates value of specific field.
   *
   * @param name - TR: Alan ad1 / EN: Field name
   * @param value - TR: Yeni deer / EN: New value
   */
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;

  /**
   * TR: Birden fazla alan deerini tek seferde günceller.
   *
   * EN: Updates multiple field values at once.
   *
   * @param values - TR: Güncellenecek deerler / EN: Values to update
   */
  patchValues: (values: Partial<T>) => void;

  /**
   * TR: Zod _emas1ndan geçirilmi_, type-safe form deerlerini döndürür.
   *
   * EN: Returns type-safe form values passed through Zod schema.
   *
   * @throws TR: Form geçersizse Zod hatas1 f1rlat1r
   *         EN: Throws Zod error if form is invalid
   */
  getValues: () => T;

  /**
   * TR: Sadece dei_en (dirty) alanlar1n deerlerini döndürür.
   * Patch update API'leri için kullan1_l1d1r.
   *
   * EN: Returns only values of changed (dirty) fields.
   * Useful for patch update APIs.
   */
  getDirtyValues: () => Partial<T>;

  /**
   * TR: Tüm alanlar1 validate eder ve sonucu döner.
   * Submit öncesi çar1lmal1d1r.
   *
   * EN: Validates all fields and returns result.
   * Should be called before submit.
   *
   * @returns TR: Form geçerli ise true / EN: True if form is valid
   */
  validateAll: () => Promise<boolean>;

  /**
   * TR: Belirli bir alan1 dirty olarak i_aretler.
   *
   * EN: Marks specific field as dirty.
   *
   * @param name - TR: Alan ad1 / EN: Field name
   */
  markDirty: (name: keyof T) => void;

  /**
   * TR: Tüm alanlar1 touched=false yapar.
   *
   * EN: Sets touched=false for all fields.
   */
  markPristine: () => void;
}

// =============================================================================
// TR: Utility Functions - Yard1mc1 Fonksiyonlar
// EN: Utility Functions
// =============================================================================

/**
 * TR: 0ki deerin derin e_itliini kontrol eder.
 * Circular reference korumas1 ile stack overflow'u önler.
 *
 * EN: Checks deep equality of two values.
 * Prevents stack overflow with circular reference protection.
 *
 * @param a - TR: 0lk deer / EN: First value
 * @param b - TR: 0kinci deer / EN: Second value
 * @param visited - TR: Ziyaret edilen nesneler (dahili) / EN: Visited objects (internal)
 * @returns TR: E_itse true / EN: True if equal
 *
 * @internal
 */
function deepEqual(
  a: unknown,
  b: unknown,
  visited = new WeakMap<object, Set<object>>()
): boolean {
  // TR: Primitif deerler için h1zl1 kontrol
  // EN: Quick check for primitive values
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  // TR: Date nesneleri için özel kontrol
  // EN: Special check for Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // TR: Object tipler için circular reference kontrolü
  // EN: Circular reference check for object types
  if (typeof a === 'object' && typeof b === 'object') {
    const objA = a as object;
    const objB = b as object;

    // TR: Circular reference kontrolü
    // EN: Circular reference check
    if (visited.has(objA)) {
      const visitedSet = visited.get(objA)!;
      if (visitedSet.has(objB)) {
        return true; // TR: Sonsuz döngüyü önle / EN: Prevent infinite loop
      }
      visitedSet.add(objB);
    } else {
      visited.set(objA, new Set([objB]));
    }

    // TR: Array kontrolü
    // EN: Array check
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index], visited));
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(objB, key) &&
        deepEqual(
          (objA as Record<string, unknown>)[key],
          (objB as Record<string, unknown>)[key],
          visited
        )
    );
  }

  return false;
}

// =============================================================================
// TR: FormSchema Class
// EN: FormSchema Class
// =============================================================================

/**
 * TR: Form yap1s1n1 tan1mlayan, yöneten ve çal1_ma zaman1nda in_a eden ana s1n1f.
 * Ba1ms1z Field tan1mlar1n1 birle_tirir, merkezi Zod validasyon _emas1 olu_turur
 * ve reaktif FormState ba_lat1r.
 *
 * EN: Main class that defines, manages, and builds form structure at runtime.
 * Combines independent Field definitions, creates central Zod validation schema,
 * and initializes reactive FormState.
 *
 * @template T - TR: Form'un veri yap1s1 / EN: Data structure of the form
 *
 * @example
 * ```typescript
 * // 1. Field'lar1 tan1mla
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
export class FormSchema<T extends Record<string, unknown>> {
  /**
   * TR: Alan ad1 -> IField mapping için h1zl1 eri_im Map'i.
   *
   * EN: Quick access Map for field name -> IField mapping.
   *
   * @private
   */
  private readonly fieldMap: Map<string, IField<unknown>>;

  /**
   * TR: Tüm alanlar1n birle_ik Zod object _emas1.
   *
   * EN: Combined Zod object schema of all fields.
   *
   * @private
   */
  private readonly zodSchema: z.ZodObject<z.ZodRawShape>;

  /**
   * TR: FormSchema constructor'1.
   *
   * EN: FormSchema constructor.
   *
   * @param fields - TR: Formu olu_turacak alan listesi. Her alan IField interface'ini
   *                 implemente etmelidir. Alan s1ras1 UI'da korunur.
   *                 EN: List of fields to create the form. Each field must implement
   *                 IField interface. Field order is preserved in UI.
   *
   * @example
   * ```typescript
   * const schema = new FormSchema([
   *   new StringField('name', 'Ad'),
   *   new NumberField('age', 'Ya_'),
   *   new DateField('birthDate', 'Doum Tarihi')
   * ]);
   * ```
   */
  constructor(private readonly fields: IField<unknown>[]) {
    // TR: H1zl1 eri_im için Map olu_tur
    // EN: Create Map for quick access
    this.fieldMap = new Map(fields.map((f) => [f.name, f]));
    this.zodSchema = this.buildZodSchema();
  }

  /**
   * TR: Tüm alanlar1n bireysel _emalar1n1 birle_tirerek tek Zod Object _emas1 olu_turur.
   *
   * EN: Creates single Zod Object schema by combining individual schemas of all fields.
   *
   * @returns TR: Birle_ik Zod object _emas1
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
   * TR: Tan1mlanan _emaya göre yeni reaktif form state (FormState) olu_turur.
   * Her çar1da ba1ms1z yeni bir state instance'1 döner.
   *
   * EN: Creates new reactive form state (FormState) based on defined schema.
   * Returns independent new state instance on each call.
   *
   * @param initial - TR: Form'un ba_lang1ç deerleri. Belirtilmeyen alanlar null olur.
   *                  EN: Initial values of the form. Unspecified fields become null.
   *
   * @returns TR: Yönetilebilir reaktif form state nesnesi
   *          EN: Manageable reactive form state object
   *
   * @example
   * ```typescript
   * // Bo_ form
   * const emptyForm = schema.createForm();
   *
   * // Ba_lang1ç deerleri ile
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
    // TR: Ba_lang1ç deerlerini sakla
    // EN: Store initial values
    const initialValues = signal<T>({ ...initial } as T);

    // TR: Her alan için FieldValue olu_tur
    // EN: Create FieldValue for each field
    const fieldEntries = this.fields.map((field) => {
      const initValue = initial[field.name as keyof T] ?? null;
      return [field.name, field.createValue(initValue)] as const;
    });

    const formFields = Object.fromEntries(fieldEntries) as FormState<T>['fields'];

    // TR: Ba_lang1ç deerlerini her alan için sakla (dirty hesaplamas1 için)
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
     * TR: Tüm form deerlerini döndüren computed signal.
     * EN: Computed signal returning all form values.
     */
    const values = computed(() => {
      const result: Record<string, unknown> = {};
      for (const [name, fv] of Object.entries(formFields)) {
        result[name] = (fv as FieldValue<unknown>).value();
      }
      return result as T;
    });

    /**
     * TR: Tüm hatalar1 toplayan computed signal.
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
     * TR: Genel geçerlilik durumu.
     * EN: Overall validity status.
     */
    const valid = computed(() => {
      return Object.values(formFields).every(
        (fv) => (fv as FieldValue<unknown>).valid()
      );
    });

    /**
     * TR: Dirty durumu - herhangi bir alan dei_ti mi?
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
     * TR: Pristine durumu - hiçbir alana dokunulmad1 m1?
     * EN: Pristine status - no field has been touched?
     */
    const pristine = computed(() => {
      return Object.values(formFields).every(
        (fv) => !(fv as FieldValue<unknown>).touched()
      );
    });

    // =========================================================================
    // TR: Action Methods - Aksiyon Metodlar1
    // EN: Action Methods
    // =========================================================================

    /**
     * TR: Tüm alanlar1 touched yap.
     * EN: Mark all fields as touched.
     */
    const touchAll = (): void => {
      for (const fv of Object.values(formFields)) {
        (fv as FieldValue<unknown>).touched.set(true);
      }
    };

    /**
     * TR: Formu s1f1rla.
     * EN: Reset the form.
     */
    const reset = (newInitial?: Partial<T>): void => {
      const resetValues = newInitial ?? initialValues();
      initialValues.set({ ...resetValues } as T);

      for (const [name, fv] of Object.entries(formFields)) {
        const val = resetValues[name as keyof T] ?? null;
        (fv as FieldValue<unknown>).value.set(val);
        (fv as FieldValue<unknown>).touched.set(false);
        initialFieldValues.set(name, val);
      }
    };

    /**
     * TR: Tek alan deeri güncelle.
     * EN: Update single field value.
     */
    const setValue = <K extends keyof T>(name: K, value: T[K]): void => {
      const fv = formFields[name];
      if (fv) {
        fv.value.set(value);
      }
    };

    /**
     * TR: Birden fazla alan deeri güncelle.
     * EN: Update multiple field values.
     */
    const patchValues = (vals: Partial<T>): void => {
      for (const [name, value] of Object.entries(vals)) {
        setValue(name as keyof T, value as T[keyof T]);
      }
    };

    /**
     * TR: Validasyondan geçmi_ deerleri al.
     * EN: Get validated values.
     */
    const getValues = (): T => {
      return this.zodSchema.parse(values()) as T;
    };

    /**
     * TR: Sadece dei_en alanlar1n deerlerini al.
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
     * TR: Tüm alanlar1 validate et.
     * EN: Validate all fields.
     */
    const validateAll = async (): Promise<boolean> => {
      touchAll();
      const result = await this.zodSchema.safeParseAsync(values());
      return result.success;
    };

    /**
     * TR: Belirli alan1 dirty olarak i_aretle.
     * EN: Mark specific field as dirty.
     */
    const markDirty = (name: keyof T): void => {
      const fv = formFields[name];
      if (fv) {
        fv.touched.set(true);
      }
    };

    /**
     * TR: Tüm alanlar1 pristine yap.
     * EN: Mark all fields as pristine.
     */
    const markPristine = (): void => {
      for (const fv of Object.values(formFields)) {
        (fv as FieldValue<unknown>).touched.set(false);
      }
    };

    return {
      fields: formFields,
      values,
      initialValues,
      valid,
      errors,
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
    };
  }

  // ===========================================================================
  // TR: Schema Utility Methods - ^ema Yard1mc1 Metodlar1
  // EN: Schema Utility Methods
  // ===========================================================================

  /**
   * TR: 0sme göre alan (Field) tan1m1n1 döndürür.
   *
   * EN: Returns field definition by name.
   *
   * @param name - TR: Alan ad1 / EN: Field name
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
   * TR: Tüm alan listesini döndürür.
   *
   * EN: Returns list of all fields.
   *
   * @returns TR: Field dizisi / EN: Array of fields
   */
  getFields(): IField<unknown>[] {
    return this.fields;
  }

  /**
   * TR: Tüm alan etiketlerini döndürür.
   * CSV/Excel export ba_l1klar1 için kullan1_l1d1r.
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
   * TR: Tüm alan adlar1n1 döndürür.
   *
   * EN: Returns all field names.
   *
   * @returns TR: Alan ad1 dizisi / EN: Array of field names
   */
  getNames(): string[] {
    return this.fields.map((f) => f.name);
  }

  /**
   * TR: Birle_ik Zod _emas1n1 döndürür.
   * 0leri seviye validasyon veya tip ç1kar1m1 için kullan1labilir.
   *
   * EN: Returns combined Zod schema.
   * Can be used for advanced validation or type inference.
   *
   * @returns TR: Zod object _emas1 / EN: Zod object schema
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
 * TR: FormSchema olu_turmak için k1sa yol fonksiyonu.
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
export function createFormSchema<T extends Record<string, unknown>>(
  fields: IField<unknown>[]
): FormSchema<T> {
  return new FormSchema<T>(fields);
}
