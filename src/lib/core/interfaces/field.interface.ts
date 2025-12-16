import { z } from 'zod';
import { FieldConfig } from './field-config.interface';
import { FieldValue } from './field-value.interface';

/**
 * @fileoverview
 * TR: Tüm alan türleri için temel sözleşmeyi (contract) tanımlayan ana arayüz.
 * Zignal form sisteminin omurgasını oluşturur. Her alan tipi bu arayüzü
 * implemente ederek tutarlı bir API sağlar.
 *
 * EN: The main interface defining the core contract for all field types.
 * Forms the backbone of the Zignal form system. Each field type implements
 * this interface to provide a consistent API.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Tüm Zignal form alanlarının uyması gereken ana sözleşme.
 * Bu arayüz, alan tipinden bağımsız olarak her alanın sahip olması gereken
 * özellikleri ve davranışları tanımlar:
 * - Kimlik (name, label)
 * - Konfigürasyon (config)
 * - Validasyon (schema)
 * - Reaktif State (createValue)
 * - Veri Dönüşümü (present, toExport, fromImport)
 *
 * EN: The main contract that all Zignal form fields must adhere to.
 * This interface defines the properties and behaviors that every field
 * must have, regardless of field type:
 * - Identity (name, label)
 * - Configuration (config)
 * - Validation (schema)
 * - Reactive State (createValue)
 * - Data Transformation (present, toExport, fromImport)
 *
 * @template T - TR: Alanın işlediği veri tipi (string, number, Date vb.)
 *               EN: Data type processed by the field (string, number, Date, etc.)
 *
 * @example
 * ```typescript
 * // IField'ı implemente eden örnek alan
 * class EmailField implements IField<string> {
 *   readonly name = 'email';
 *   readonly label = 'E-posta';
 *   readonly config = { required: true };
 *
 *   schema() {
 *     return z.string().email('Geçerli bir e-posta giriniz');
 *   }
 *
 *   createValue(initial?: string) { ... }
 *   present(value: string | null) { return value ?? '-'; }
 *   toExport(value: string | null) { return value; }
 *   fromImport(raw: unknown) { ... }
 * }
 * ```
 */
export interface IField<T = unknown> {
  /**
   * TR: Alanın sistemdeki benzersiz tanımlayıcısı.
   * Form submit'te JSON key olarak, veritabanında kolon adı olarak kullanılır.
   * camelCase formatında olmalıdır (örn: 'firstName', 'birthDate').
   *
   * EN: Unique identifier of the field in the system.
   * Used as JSON key in form submit, column name in database.
   * Should be in camelCase format (e.g., 'firstName', 'birthDate').
   *
   * @example 'email', 'phoneNumber', 'dateOfBirth'
   */
  readonly name: string;

  /**
   * TR: Kullanıcı arayüzünde gösterilecek okunabilir etiket.
   * Input label, tablo başlığı veya hata mesajlarında alan adı olarak kullanılır.
   * Lokalize edilebilir.
   *
   * EN: Human-readable label to be displayed in the user interface.
   * Used as input label, table header, or field name in error messages.
   * Can be localized.
   *
   * @example 'E-posta Adresi', 'Telefon Numarası'
   */
  readonly label: string;

  /**
   * TR: Alana özgü yapılandırma ayarlarını tutan nesne.
   * required, hint, placeholder gibi ortak ayarları içerir.
   * Her alan tipi kendi config arayüzünü genişletebilir.
   *
   * EN: Object holding configuration settings specific to the field.
   * Contains common settings like required, hint, placeholder.
   * Each field type can extend its own config interface.
   */
  readonly config: FieldConfig;

  /**
   * TR: Alanın doğrulama kurallarını içeren Zod şemasını döndürür.
   * Bu şema runtime'da veri validasyonu ve TypeScript'te tip çıkarımı için kullanılır.
   * Her alan tipi kendi validasyon kurallarını burada tanımlar.
   *
   * EN: Returns the Zod schema containing the validation rules for the field.
   * This schema is used for runtime data validation and TypeScript type inference.
   * Each field type defines its own validation rules here.
   *
   * @returns TR: Zod tip şeması
   *          EN: Zod type schema
   *
   * @example
   * ```typescript
   * // String alan için
   * schema() {
   *   return z.string().min(1, 'Bu alan zorunludur').max(100);
   * }
   *
   * // Tarih alanı için
   * schema() {
   *   return z.date().min(new Date('1900-01-01'));
   * }
   * ```
   */
  schema(): z.ZodType<T>;

  /**
   * TR: Alan için reaktif durum nesnesini (FieldValue) oluşturur ve döndürür.
   * Her çağrıda yeni bir state instance'ı oluşturulur.
   * Başlangıç değeri verilirse state bu değerle initialize edilir.
   *
   * EN: Creates and returns the reactive state object (FieldValue) for the field.
   * A new state instance is created on each call.
   * If an initial value is provided, the state is initialized with this value.
   *
   * @param initial - TR: Alanın başlangıç değeri (opsiyonel)
   *                  EN: Initial value of the field (optional)
   * @returns TR: Signal tabanlı reaktif alan durumu
   *          EN: Signal-based reactive field state
   *
   * @example
   * ```typescript
   * const emailField = new StringField('email', 'E-posta');
   * const state = emailField.createValue('default@email.com');
   *
   * // Değeri oku
   * console.log(state.value()); // 'default@email.com'
   *
   * // Değeri güncelle
   * state.value.set('new@email.com');
   * ```
   */
  createValue(initial?: T): FieldValue<T>;

  /**
   * TR: Ham veriyi kullanıcı arayüzünde gösterilmek üzere formatlar.
   * Tablo hücresi, özet kartı veya readonly görünümlerde kullanılır.
   * Her alan tipi kendi sunum formatını tanımlayabilir.
   *
   * EN: Formats raw data for display in the user interface.
   * Used in table cells, summary cards, or readonly views.
   * Each field type can define its own presentation format.
   *
   * @param value - TR: Formatlanacak ham değer
   *                EN: Raw value to be formatted
   * @returns TR: Kullanıcı dostu string gösterimi
   *          EN: User-friendly string representation
   *
   * @example
   * ```typescript
   * // DateField için
   * present(value: Date | null) {
   *   return value ? format(value, 'dd.MM.yyyy') : '-';
   * }
   *
   * // CurrencyField için
   * present(value: number | null) {
   *   return value != null ? `${value.toFixed(2)} TL` : '-';
   * }
   * ```
   */
  present(value: T | null): string;

  /**
   * TR: Uygulama içi veriyi dışa aktarım formatına dönüştürür.
   * API'ye gönderim, JSON export veya Excel export için kullanılır.
   * Tarih, dosya gibi özel tipler uygun formata serialize edilir.
   *
   * EN: Converts in-app data to export format.
   * Used for API submission, JSON export, or Excel export.
   * Special types like dates, files are serialized to appropriate formats.
   *
   * @param value - TR: Dışa aktarılacak uygulama içi değer
   *                EN: In-app value to be exported
   * @returns TR: Serialize edilmiş, dışa aktarıma uygun veri
   *          EN: Serialized data suitable for export
   *
   * @example
   * ```typescript
   * // DateField için
   * toExport(value: Date | null) {
   *   return value?.toISOString() ?? null;
   * }
   *
   * // FileField için
   * toExport(value: File | null) {
   *   return value ? { name: value.name, size: value.size } : null;
   * }
   * ```
   */
  toExport(value: T | null): unknown;

  /**
   * TR: Dış kaynaktan gelen ham veriyi uygulamanın kullanabileceği tipe dönüştürür.
   * API response, JSON import veya Excel import verilerini parse eder.
   * Type coercion ve validasyon işlemleri burada yapılır.
   *
   * EN: Converts raw data from external source into a type usable by the application.
   * Parses API response, JSON import, or Excel import data.
   * Type coercion and validation operations are performed here.
   *
   * @param raw - TR: Dış kaynaktan gelen ham, tipi belirsiz veri
   *              EN: Raw, untyped data from external source
   * @returns TR: Parse edilmiş ve doğrulanmış değer, başarısızsa null
   *          EN: Parsed and validated value, null if failed
   *
   * @example
   * ```typescript
   * // DateField için
   * fromImport(raw: unknown) {
   *   if (typeof raw === 'string') {
   *     const date = new Date(raw);
   *     return isNaN(date.getTime()) ? null : date;
   *   }
   *   return null;
   * }
   * ```
   */
  fromImport(raw: unknown): T | null;

  /**
   * TR: Filtreleme arayüzlerinde kullanılacak kısa önizleme metni oluşturur.
   * Aktif filtre chip'lerinde veya özet görünümlerde gösterilir.
   * Değer boş veya anlamsızsa null dönebilir.
   *
   * EN: Generates short preview text for use in filtering interfaces.
   * Displayed in active filter chips or summary views.
   * Can return null if value is empty or meaningless.
   *
   * @param value - TR: Önizlenecek değer
   *                EN: Value to preview
   * @returns TR: Kısa önizleme metni veya null
   *          EN: Short preview text or null
   *
   * @example
   * ```typescript
   * // DateRangeField için
   * filterPreview(value: DateRange | null) {
   *   if (!value) return null;
   *   return `${format(value.start)} - ${format(value.end)}`;
   * }
   * ```
   */
  filterPreview(value: T | null): string | null;
}

/**
 * TR: Desteklenen alan türlerini belirten tip tanımı.
 * Dinamik form oluşturma ve component registry için kullanılır.
 * Yeni alan tipleri eklendiğinde bu union type güncellenmeli.
 *
 * EN: Type definition specifying supported field types.
 * Used for dynamic form generation and component registry.
 * This union type should be updated when new field types are added.
 *
 * @example
 * ```typescript
 * const fieldConfig: { type: FieldType; name: string } = {
 *   type: 'string',
 *   name: 'firstName'
 * };
 * ```
 */
export type FieldType =
  | 'string'      // TR: Tek satır metin / EN: Single-line text
  | 'text'        // TR: Çok satır metin (textarea) / EN: Multi-line text (textarea)
  | 'number'      // TR: Sayısal değer / EN: Numeric value
  | 'boolean'     // TR: Evet/Hayır değeri / EN: Yes/No value
  | 'date'        // TR: Tarih (saat hariç) / EN: Date (without time)
  | 'datetime'    // TR: Tarih ve saat / EN: Date and time
  | 'select'      // TR: Tek seçimli dropdown / EN: Single-select dropdown
  | 'multiselect' // TR: Çoklu seçimli dropdown / EN: Multi-select dropdown
  | 'json'        // TR: JSON/Object veri yapısı / EN: JSON/Object data structure
  | 'file'        // TR: Dosya yükleme / EN: File upload
  | 'array'       // TR: Tekrarlanabilir alan grubu / EN: Repeatable field group
  | 'group'       // TR: İç içe alan grubu / EN: Nested field group
  | 'phone'       // TR: Telefon numarası / EN: Phone number
  | 'password'    // TR: Şifre alanı / EN: Password field
  | 'color'       // TR: Renk seçici / EN: Color picker
  | 'email'       // TR: E-posta adresi / EN: Email address
  | 'url';        // TR: Web adresi / EN: Web address
