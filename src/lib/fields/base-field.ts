import { signal, computed } from '@angular/core';
import { z } from 'zod';
import {
  IField,
  FieldConfig,
  FieldValue,
  ImportResult
} from '../core/interfaces';

/**
 * @fileoverview
 * TR: T﷿m form alan1 t﷿rlerinin t﷿retildii soyut temel s1n1f.
 * IField aray﷿z﷿n﷿ implemente eder ve ortak i_levsellii merkezi olarak salar.
 * Alt s1n1flar sadece kendilerine ﷿zg﷿ schema() metodunu implemente eder.
 *
 * EN: Abstract base class from which all form field types are derived.
 * Implements the IField interface and provides common functionality centrally.
 * Subclasses only implement their specific schema() method.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: T﷿m Zignal form alanlar1n1n temel s1n1f1.
 * Bu abstract class, form alanlar1 i﷿in gerekli t﷿m ortak i_levsellii salar:
 *
 * - **Reaktif State Y﷿netimi**: Angular Signals ile fine-grained reactivity
 * - **Validasyon**: Zod schema entegrasyonu ile type-safe dorulama
 * - **Veri D﷿n﷿_﷿m﷿**: Import/Export i_lemleri i﷿in standart metodlar
 * - **UI Sunumu**: Deerlerin kullan1c1 dostu g﷿sterimi
 *
 * Alt s1n1flar (StringField, NumberField vb.) sadece `schema()` metodunu
 * override ederek kendi validasyon kurallar1n1 tan1mlar.
 *
 * EN: Base class for all Zignal form fields.
 * This abstract class provides all common functionality required for form fields:
 *
 * - **Reactive State Management**: Fine-grained reactivity with Angular Signals
 * - **Validation**: Type-safe validation with Zod schema integration
 * - **Data Transformation**: Standard methods for Import/Export operations
 * - **UI Presentation**: User-friendly display of values
 *
 * Subclasses (StringField, NumberField, etc.) only override the `schema()` method
 * to define their own validation rules.
 *
 * @template T - TR: Alan1n ta_1d11 veri tipi (string, number, Date vb.)
 *               EN: Data type held by the field (string, number, Date, etc.)
 *
 * @example
 * ```typescript
 * // Yeni bir field tipi olu_turma
 * class EmailField extends BaseField<string> {
 *   schema(): z.ZodType<string> {
 *     const base = z.string().email('Ge﷿erli bir e-posta giriniz');
 *     return this.applyRequired(base);
 *   }
 * }
 *
 * // Kullan1m
 * const emailField = new EmailField('email', 'E-posta Adresi', { required: true });
 * const state = emailField.createValue('');
 *
 * state.value.set('test@example.com');
 * console.log(state.valid()); // true
 * ```
 */
export abstract class BaseField<T> implements IField<T> {
  /**
   * TR: BaseField constructor'1. T﷿m field'lar i﷿in ortak ba_latma i_lemlerini yapar.
   *
   * EN: BaseField constructor. Performs common initialization for all fields.
   *
   * @param name - TR: Alan1n benzersiz tan1mlay1c1s1. Form state'inde key olarak kullan1l1r.
   *               camelCase format1nda olmal1 (﷿rn: 'firstName', 'emailAddress').
   *               EN: Unique identifier of the field. Used as key in form state.
   *               Should be in camelCase format (e.g., 'firstName', 'emailAddress').
   *
   * @param label - TR: Kullan1c1 aray﷿z﷿nde g﷿sterilecek etiket.
   *                Input ﷿st﷿nde, tablo ba_l11nda veya hata mesajlar1nda kullan1l1r.
   *                EN: Label to be displayed in user interface.
   *                Used above inputs, in table headers, or in error messages.
   *
   * @param config - TR: Opsiyonel alan yap1land1rmas1.
   *                 required, hint, placeholder gibi ortak ayarlar1 i﷿erir.
   *                 EN: Optional field configuration.
   *                 Contains common settings like required, hint, placeholder.
   *
   * @example
   * ```typescript
   * class CustomField extends BaseField<string> {
   *   constructor(name: string, label: string, config?: FieldConfig) {
   *     super(name, label, config);
   *   }
   *
   *   schema() { return z.string(); }
   * }
   *
   * const field = new CustomField('username', 'Kullan1c1 Ad1', {
   *   required: true,
   *   placeholder: 'johndoe',
   *   hint: 'En az 3 karakter olmal1d1r'
   * });
   * ```
   */
  constructor(
    public readonly name: string,
    public readonly label: string,
    public readonly config: FieldConfig = {}
  ) {}

  /**
   * TR: Alt s1n1flar taraf1ndan implemente edilmesi ZORUNLU olan abstract metod.
   * Her alan tipi, kendi veri yap1s1na uygun Zod validasyon _emas1n1 burada tan1mlar.
   *
   * Bu metodun d﷿nd﷿rd﷿﷿ _ema:
   * - Runtime'da veri validasyonu i﷿in kullan1l1r
   * - TypeScript tip ﷿1kar1m1 salar
   * - Hata mesajlar1 ﷿retir
   *
   * EN: Abstract method that MUST be implemented by subclasses.
   * Each field type defines the Zod validation schema appropriate for its data structure here.
   *
   * The schema returned by this method:
   * - Is used for runtime data validation
   * - Provides TypeScript type inference
   * - Generates error messages
   *
   * @returns TR: Zod _emas1. Validasyon kurallar1 ve hata mesajlar1 i﷿erir.
   *          EN: Zod schema. Contains validation rules and error messages.
   *
   * @example
   * ```typescript
   * // StringField i﷿in
   * schema(): z.ZodType<string> {
   *   let base = z.string();
   *
   *   if (this.minLength) {
   *     base = base.min(this.minLength, `En az ${this.minLength} karakter`);
   *   }
   *
   *   return this.applyRequired(base);
   * }
   *
   * // NumberField i﷿in
   * schema(): z.ZodType<number> {
   *   let base = z.number();
   *
   *   if (this.min !== undefined) {
   *     base = base.min(this.min);
   *   }
   *
   *   return this.applyRequired(base);
   * }
   * ```
   */
  abstract schema(): z.ZodType<T>;

  /**
   * TR: Alan i﷿in reaktif state nesnesini (FieldValue) olu_turur ve d﷿nd﷿r﷿r.
   *
   * Bu metod Angular Signals kullanarak _u yap1y1 olu_turur:
   * - `value`: Yaz1labilir sinyal - alan1n anl1k deeri
   * - `touched`: Yaz1labilir sinyal - kullan1c1 etkile_im durumu
   * - `error`: Computed sinyal - validasyon hata mesaj1 (sadece touched ise)
   * - `valid`: Computed sinyal - ge﷿erlilik durumu (touched'dan ba1ms1z)
   *
   * EN: Creates and returns the reactive state object (FieldValue) for the field.
   *
   * This method creates the following structure using Angular Signals:
   * - `value`: Writable signal - current value of the field
   * - `touched`: Writable signal - user interaction status
   * - `error`: Computed signal - validation error message (only if touched)
   * - `valid`: Computed signal - validity status (independent of touched)
   *
   * @param initial - TR: Ba_lang1﷿ deeri. Belirtilmezse undefined kullan1l1r.
   *                  EN: Initial value. Uses undefined if not specified.
   *
   * @returns TR: Signal tabanl1 reaktif alan state'i
   *          EN: Signal-based reactive field state
   *
   * @example
   * ```typescript
   * const emailField = new StringField('email', 'E-posta');
   * const state = emailField.createValue('');
   *
   * // UI'da input dei_tiinde
   * state.value.set(inputElement.value);
   *
   * // Blur event'inde touched i_aretle
   * state.touched.set(true);
   *
   * // Template'de error g﷿ster
   * @if (state.error()) {
   *   <mat-error>{{ state.error() }}</mat-error>
   * }
   *
   * // Form submit ﷿ncesi valid kontrol
   * if (!state.valid()) {
   *   state.touched.set(true); // Hatalar1 g﷿ster
   *   return;
   * }
   * ```
   */
  createValue(initial?: T): FieldValue<T> {
    const value = signal<T>(initial as T);
    const touched = signal(false);

    /**
     * TR: Validasyon sonucunu hesaplayan saf (pure) computed sinyal.
     * touched durumundan ba1ms1z olarak verinin ge﷿erliliini kontrol eder.
     * Her value dei_iminde otomatik yeniden hesaplan1r.
     *
     * EN: Pure computed signal that calculates validation result.
     * Checks data validity independent of touched state.
     * Automatically recalculated on each value change.
     */
    const validationResult = computed(() => {
      return this.schema().safeParse(value());
    });

    /**
     * TR: Ge﷿erlilik durumu computed sinyali.
     * Sadece verinin valid olup olmad11na bakar, touched durumu ﷿nemsizdir.
     * Form submit kontrollerinde bu signal kullan1lmal1d1r.
     *
     * EN: Validity status computed signal.
     * Only checks if data is valid, touched state is irrelevant.
     * This signal should be used for form submit checks.
     */
    const valid = computed(() => validationResult().success);

    /**
     * TR: Hata mesaj1 computed sinyali.
     * Sadece touched=true ise hata mesaj1 d﷿ner, aksi halde null.
     * Bu sayede kullan1c1 hen﷿z yazmaya ba_lam1_ken hata g﷿rmez.
     *
     * EN: Error message computed signal.
     * Returns error message only if touched=true, otherwise null.
     * This way user doesn't see errors while still typing.
     */
    const error = computed(() => {
      // TR: Dokunulmad1ysa hata g﷿sterme (UX best practice)
      // EN: Don't show error if not touched (UX best practice)
      if (!touched()) return null;

      const result = validationResult();

      // TR: Veri ge﷿erliyse hata yok
      // EN: No error if data is valid
      if (result.success) return null;

      // TR: 0lk hata mesaj1n1 d﷿n
      // EN: Return first error message
      return result.error.errors[0]?.message ?? 'Ge﷿ersiz deer';
    });

    return { value, error, touched, valid };
  }

  /**
   * TR: Ham veriyi kullan1c1 aray﷿z﷿nde g﷿sterilmek ﷿zere formatlar.
   * Tablo h﷿creleri, ﷿zet kartlar1 veya readonly g﷿r﷿n﷿mlerde kullan1l1r.
   *
   * Varsay1lan davran1_:
   * - null/undefined ﷿ tire (-) i_areti
   * - Dier deerler ﷿ String d﷿n﷿_﷿m﷿
   *
   * Alt s1n1flar daha spesifik formatlama i﷿in override edebilir.
   *
   * EN: Formats raw data for display in the user interface.
   * Used in table cells, summary cards, or readonly views.
   *
   * Default behavior:
   * - null/undefined ﷿ dash (-) character
   * - Other values ﷿ String conversion
   *
   * Subclasses can override for more specific formatting.
   *
   * @param value - TR: Formatlanacak ham deer
   *                EN: Raw value to format
   *
   * @returns TR: Kullan1c1 dostu string g﷿sterimi
   *          EN: User-friendly string representation
   *
   * @example
   * ```typescript
   * // DateField override ﷿rnei
   * present(value: Date | null): string {
   *   if (value == null) return '-';
   *   return new Intl.DateTimeFormat('tr-TR').format(value);
   * }
   *
   * // CurrencyField override ﷿rnei
   * present(value: number | null): string {
   *   if (value == null) return '-';
   *   return new Intl.NumberFormat('tr-TR', {
   *     style: 'currency',
   *     currency: 'TRY'
   *   }).format(value);
   * }
   * ```
   */
  present(value: T | null): string {
    if (value == null) return '-';
    return String(value);
  }

  /**
   * TR: Uygulama i﷿i veriyi d1_a aktar1m format1na d﷿n﷿_t﷿r﷿r.
   * API g﷿nderimi, JSON export veya Excel export i﷿in kullan1l1r.
   *
   * Varsay1lan davran1_ deeri olduu gibi d﷿nd﷿r﷿r.
   * ﷿zel tipler (Date, File vb.) i﷿in alt s1n1flar override etmelidir.
   *
   * EN: Converts in-app data to export format.
   * Used for API submission, JSON export, or Excel export.
   *
   * Default behavior returns the value as is.
   * Subclasses should override for special types (Date, File, etc.).
   *
   * @param value - TR: D1_a aktar1lacak uygulama i﷿i deer
   *                EN: In-app value to export
   *
   * @returns TR: Serialize edilmi_ veri
   *          EN: Serialized data
   *
   * @example
   * ```typescript
   * // DateField override ﷿rnei
   * toExport(value: Date | null): string | null {
   *   return value?.toISOString() ?? null;
   * }
   * ```
   */
  toExport(value: T | null): unknown {
    return value;
  }

  /**
   * TR: D1_ kaynaktan gelen ham veriyi uygulama tipine d﷿n﷿_t﷿r﷿r.
   * Zod schema ile parse ederek tip g﷿venlii salar.
   *
   * Ba_ar1s1z parse durumunda null d﷿ner (sessiz hata).
   * Detayl1 hata bilgisi i﷿in `fromImportWithDetails` kullan1n.
   *
   * EN: Converts raw data from external source to application type.
   * Provides type safety by parsing with Zod schema.
   *
   * Returns null on failed parse (silent error).
   * Use `fromImportWithDetails` for detailed error information.
   *
   * @param raw - TR: D1_ kaynaktan gelen ham veri
   *              EN: Raw data from external source
   *
   * @returns TR: Parse edilmi_ deer veya hata durumunda null
   *          EN: Parsed value or null on error
   *
   * @example
   * ```typescript
   * const dateField = new DateField('startDate', 'Ba_lang1﷿');
   *
   * // API'den gelen ISO string
   * const date = dateField.fromImport('2024-01-15T10:30:00Z');
   * // date = Date object veya null
   * ```
   */
  fromImport(raw: unknown): T | null {
    const result = this.schema().safeParse(raw);
    return result.success ? result.data : null;
  }

  /**
   * TR: D1_ kaynaktan gelen veriyi detayl1 sonu﷿la birlikte parse eder.
   * fromImport'tan fark1: Hata durumunda detayl1 hata bilgisi d﷿ner.
   *
   * Kullan1m senaryolar1:
   * - Toplu import i_lemlerinde hata raporlama
   * - Kullan1c1ya spesifik hata mesaj1 g﷿sterme
   * - Hata loglamas1
   *
   * EN: Parses data from external source with detailed result.
   * Differs from fromImport: Returns detailed error info on failure.
   *
   * Usage scenarios:
   * - Error reporting in bulk import operations
   * - Showing specific error messages to user
   * - Error logging
   *
   * @param raw - TR: D1_ kaynaktan gelen ham veri
   *              EN: Raw data from external source
   *
   * @returns TR: Ba_ar1/hata durumu, veri ve hata detaylar1n1 i﷿eren nesne
   *          EN: Object containing success/error status, data, and error details
   *
   * @example
   * ```typescript
   * const result = field.fromImportWithDetails(rawValue);
   *
   * if (result.success) {
   *   console.log('Veri:', result.data);
   * } else {
   *   console.error('Hata:', result.error?.message);
   *   console.error('Konum:', result.error?.path?.join('.'));
   * }
   * ```
   */
  fromImportWithDetails(raw: unknown): ImportResult<T> {
    const result = this.schema().safeParse(raw);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    const firstError = result.error.errors[0];
    return {
      success: false,
      data: null,
      error: {
        message: firstError?.message ?? 'Ge﷿ersiz veri',
        path: firstError?.path,
        code: firstError?.code,
      },
    };
  }

  /**
   * TR: Filtreleme aray﷿zlerinde kullan1lacak k1sa ﷿nizleme metni olu_turur.
   * Aktif filtre chip'lerinde veya ﷿zet g﷿r﷿n﷿mlerde g﷿sterilir.
   *
   * Varsay1lan davran1_ `present()` metodunu kullan1r.
   * Null deerler i﷿in null d﷿ner (filtre chip'i g﷿sterilmez).
   *
   * EN: Generates short preview text for use in filtering interfaces.
   * Displayed in active filter chips or summary views.
   *
   * Default behavior uses the `present()` method.
   * Returns null for null values (filter chip not shown).
   *
   * @param value - TR: ﷿nizlenecek deer
   *                EN: Value to preview
   *
   * @returns TR: K1sa ﷿nizleme metni veya null
   *          EN: Short preview text or null
   *
   * @example
   * ```typescript
   * // DateRangeField override ﷿rnei
   * filterPreview(value: DateRange | null): string | null {
   *   if (!value?.start || !value?.end) return null;
   *   return `${this.formatDate(value.start)} - ${this.formatDate(value.end)}`;
   * }
   * ```
   */
  filterPreview(value: T | null): string | null {
    if (value == null) return null;
    return this.present(value);
  }

  /**
   * TR: Config'deki `required` ayar1na g﷿re _emay1 nullable/optional yapar veya olduu gibi b1rak1r.
   * Bu metod alt s1n1flar1n schema() metodunda kullan1lmak ﷿zere tasarlanm1_t1r.
   *
   * Davran1_:
   * - config.required = true ﷿ ^ema olduu gibi d﷿ner (zorunlu)
   * - config.required = false/undefined ﷿ ^ema nullable().optional() olur
   *
   * EN: Makes the schema nullable/optional based on the `required` setting in config, or leaves it as is.
   * This method is designed to be used in subclasses' schema() method.
   *
   * Behavior:
   * - config.required = true ﷿ Schema returned as is (required)
   * - config.required = false/undefined ﷿ Schema becomes nullable().optional()
   *
   * @param schema - TR: 0_lenecek Zod _emas1
   *                 EN: Zod schema to process
   *
   * @returns TR: Required durumuna g﷿re modifiye edilmi_ _ema
   *          EN: Schema modified according to required status
   *
   * @example
   * ```typescript
   * // Alt s1n1fta kullan1m
   * schema(): z.ZodType<string> {
   *   const base = z.string().min(1, 'Bu alan zorunludur');
   *   return this.applyRequired(base);
   * }
   * ```
   *
   * @protected
   */
  protected applyRequired<S extends z.ZodType>(schema: S): S {
    if (this.config.required) {
      return schema as S;
    }
    // TR: Zorunlu deilse null veya undefined kabul edilir
    // EN: If not required, null or undefined is accepted
    return schema.nullable().optional() as unknown as S;
  }
}
