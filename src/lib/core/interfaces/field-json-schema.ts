import { FieldType } from './field.interface';

/**
 * @fileoverview
 * TR: Backend'den veya JSON dosyasından gelen alan tanımlarını parse etmek için
 * kullanılan şema arayüzü. Schema-driven form oluşturmanın temelidir.
 *
 * EN: Schema interface used to parse field definitions coming from backend
 * or JSON files. This is the foundation of schema-driven form generation.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: JSON formatında gelen alan tanımını temsil eden şema arayüzü.
 * Backend'den dinamik olarak gelen form yapılandırmalarını parse etmek,
 * veya JSON dosyalarından form tanımlarını yüklemek için kullanılır.
 *
 * EN: Schema interface representing a field definition in JSON format.
 * Used to parse form configurations coming dynamically from the backend,
 * or to load form definitions from JSON files.
 *
 * @example
 * ```typescript
 * // Backend'den gelen JSON
 * const fieldSchemas: FieldJsonSchema[] = [
 *   {
 *     type: 'string',
 *     name: 'email',
 *     label: 'E-posta',
 *     defaultValue: '',
 *     config: {
 *       required: true,
 *       placeholder: 'ornek@email.com'
 *     }
 *   },
 *   {
 *     type: 'date',
 *     name: 'birthDate',
 *     label: 'Doğum Tarihi'
 *   }
 * ];
 *
 * // SchemaFactory ile parse et
 * const fields = schemaFactory.parse(fieldSchemas);
 * ```
 */
export interface FieldJsonSchema {
  /**
   * TR: Alanın tipi. Bu değere göre uygun Field sınıfı seçilir.
   * Registry'de kayıtlı olmayan bir tip gelirse fallback olarak 'text' kullanılır.
   *
   * EN: Type of the field. The appropriate Field class is selected based on this value.
   * If an unregistered type is received, 'text' is used as fallback.
   */
  type: FieldType | string;

  /**
   * TR: Alanın benzersiz tanımlayıcısı. Form state'inde key olarak kullanılır.
   * Genellikle backend model property adıyla eşleşir.
   *
   * EN: Unique identifier of the field. Used as key in form state.
   * Usually matches the backend model property name.
   */
  name: string;

  /**
   * TR: Kullanıcı arayüzünde gösterilecek etiket.
   * Belirtilmezse name değeri label olarak kullanılabilir.
   *
   * EN: Label to be displayed in the user interface.
   * If not specified, the name value can be used as label.
   */
  label?: string;

  /**
   * TR: Alanın varsayılan değeri. Form ilk yüklendiğinde bu değer kullanılır.
   * Tip, alan tipine uygun olmalıdır (string için string, date için ISO string vb.)
   *
   * EN: Default value of the field. This value is used when the form is first loaded.
   * Type should match the field type (string for string, ISO string for date, etc.)
   */
  defaultValue?: unknown;

  /**
   * TR: Alana özgü ek yapılandırma seçenekleri.
   * required, placeholder, hint gibi FieldConfig özelliklerini içerir.
   * Alan tipine göre özel ayarlar da eklenebilir (örn: select için options).
   *
   * EN: Additional configuration options specific to the field.
   * Contains FieldConfig properties like required, placeholder, hint.
   * Type-specific settings can also be added (e.g., options for select).
   */
  config?: Record<string, unknown>;

  /**
   * TR: Zod validasyon şeması için ek kurallar.
   * min, max, pattern gibi validasyon kurallarını JSON olarak tanımlar.
   *
   * EN: Additional rules for Zod validation schema.
   * Defines validation rules like min, max, pattern as JSON.
   *
   * @example
   * ```typescript
   * validation: {
   *   min: 0,
   *   max: 100,
   *   pattern: '^[A-Z]',
   *   message: 'Değer 0-100 arasında olmalı'
   * }
   * ```
   */
  validation?: Record<string, unknown>;
}
