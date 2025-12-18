import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: JSON/Object tipinde verileri yöneten alan sınıfı.
 * Karmaşık, iç içe veri yapılarını form içinde kullanmak için idealdir.
 * Zod ile yapısal validasyon, dot-notation erişim ve immutable güncelleme sağlar.
 *
 * EN: Field class for managing JSON/Object type data.
 * Ideal for using complex, nested data structures within forms.
 * Provides structural validation with Zod, dot-notation access, and immutable updates.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: JsonField için genişletilmiş yapılandırma arayüzü.
 * JSON verisinin yapısal doğrulaması ve görüntüleme seçeneklerini tanımlar.
 *
 * EN: Extended configuration interface for JsonField.
 * Defines structural validation and display options for JSON data.
 *
 * @example
 * ```typescript
 * const config: JsonFieldConfig = {
 *   required: true,
 *   schema: z.object({
 *     name: z.string(),
 *     age: z.number()
 *   }),
 *   prettyPrint: true,
 *   maxDisplayDepth: 3
 * };
 * ```
 */
export interface JsonFieldConfig extends FieldConfig {
    /**
     * TR: JSON içeriğini doğrulamak için kullanılacak özel Zod şeması.
     * Eğer belirtilmezse, herhangi bir geçerli obje kabul edilir.
     *
     * EN: Custom Zod schema used to validate JSON content.
     * If not specified, any valid object is accepted.
     *
     * @example
     * ```typescript
     * schema: z.object({
     *   address: z.object({
     *     street: z.string(),
     *     city: z.string()
     *   })
     * })
     * ```
     */
    schema?: z.ZodType<unknown>;

    /**
     * TR: Görüntüleme sırasında JSON'un okunabilir formatta olup olmayacağı.
     * true ise girintili (indented) gösterim yapılır.
     *
     * EN: Whether the JSON should be in readable format during display.
     * If true, indented display is used.
     *
     * @default false
     */
    prettyPrint?: boolean;

    /**
     * TR: JSON gösteriminin maksimum derinlik sınırı.
     * Derin nesnelerin UI performansını etkilememesi için kullanılır.
     *
     * EN: Maximum depth limit for JSON display.
     * Used to prevent deep objects from affecting UI performance.
     *
     * @default 5
     */
    maxDisplayDepth?: number;

    /**
     * TR: present() metodunda gösterilecek maksimum karakter sayısı.
     * Uzun JSON'ların kısaltılması için kullanılır.
     *
     * EN: Maximum character count to be shown in present() method.
     * Used for truncating long JSONs.
     *
     * @default 100
     */
    maxDisplayLength?: number;
}

/**
 * TR: Karmaşık nesne ve dinamik veri yapılarını yöneten alan sınıfı.
 *
 * Bu sınıf şu özellikleri sağlar:
 * - **Yapısal Validasyon**: Zod şeması ile JSON içeriğinin doğrulanması
 * - **Dot Notation Erişim**: Derin verilere `user.address.city` formatında erişim
 * - **Immutable Güncelleme**: Orijinal veriyi değiştirmeden güncelleme
 * - **Import/Export**: JSON string ↔ Object dönüşümü
 * - **Güvenli Parse**: Hatalı JSON'ların güvenli işlenmesi
 *
 * EN: Field class for managing complex objects and dynamic data structures.
 *
 * This class provides:
 * - **Structural Validation**: Validating JSON content with Zod schema
 * - **Dot Notation Access**: Accessing deep data in `user.address.city` format
 * - **Immutable Update**: Updating without modifying original data
 * - **Import/Export**: JSON string ↔ Object conversion
 * - **Safe Parse**: Safe handling of malformed JSONs
 *
 * @example
 * ```typescript
 * // Basit kullanım
 * const metadataField = new JsonField('metadata', 'Metadata');
 * const state = metadataField.createValue({ version: '1.0' });
 *
 * // Özel schema ile
 * const addressField = new JsonField('address', 'Adres', {
 *   required: true,
 *   schema: z.object({
 *     street: z.string().min(1),
 *     city: z.string(),
 *     zipCode: z.string().regex(/^\d{5}$/)
 *   })
 * });
 *
 * // Dot notation erişim
 * const value = addressField.getValue(state.value(), 'city');
 *
 * // Immutable güncelleme
 * const updated = addressField.setValue(state.value(), 'city', 'İstanbul');
 * state.value.set(updated);
 * ```
 */
export class JsonField extends BaseField<Record<string, unknown>> {
    readonly type = 'json';
    /**
     * TR: JsonField constructor. Yapılandırma ile JSON alanı oluşturur.
     *
     * EN: JsonField constructor. Creates a JSON field with configuration.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı / EN: Unique field identifier
     * @param label - TR: UI'da gösterilecek etiket / EN: Label to display in UI
     * @param config - TR: JSON alan yapılandırması / EN: JSON field configuration
     */
    constructor(
        name: string,
        label: string,
        public override config: JsonFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: JSON verisi için Zod doğrulama şemasını oluşturur.
     * Config'de özel schema varsa onu kullanır, yoksa genel Record şeması döner.
     *
     * EN: Creates the Zod validation schema for JSON data.
     * Uses custom schema from config if available, otherwise returns generic Record schema.
     *
     * @returns TR: Record tipi Zod şeması / EN: Record type Zod schema
     */
    schema(): z.ZodType<Record<string, unknown>> {
        // TR: Özel schema varsa onu kullan
        // EN: Use custom schema if exists
        if (this.config.schema) {
            const customSchema = this.config.schema as z.ZodType<Record<string, unknown>>;
            return this.applyRequired(customSchema);
        }

        // TR: Varsayılan: Herhangi bir obje kabul et
        // EN: Default: Accept any object
        const defaultSchema = z.record(z.unknown(), {
            required_error: t('required'),
        });

        return this.applyRequired(defaultSchema) as z.ZodType<Record<string, unknown>>;
    }

    /**
     * TR: JSON nesnesini UI'da gösterilmek üzere string formatına çevirir.
     * prettyPrint ayarına göre formatlar, uzun içerikleri kısaltır.
     *
     * EN: Converts the JSON object to string format for display in UI.
     * Formats according to prettyPrint setting, truncates long content.
     *
     * @param value - TR: Gösterilecek JSON değeri / EN: JSON value to display
     * @returns TR: Formatlanmış string / EN: Formatted string
     */
    override present(value: Record<string, unknown> | null): string {
        if (value == null) return '-';

        try {
            const maxLength = this.config.maxDisplayLength ?? 100;

            if (this.config.prettyPrint) {
                return JSON.stringify(value, null, 2);
            }

            const str = JSON.stringify(value);

            // TR: Çok uzunsa kısalt
            // EN: Truncate if too long
            if (str.length > maxLength) {
                return str.substring(0, maxLength) + '...';
            }

            return str;
        } catch {
            return '[Geçersiz JSON]';
        }
    }

    /**
     * TR: Dışa aktarım için veriyi JSON string'e dönüştürür.
     *
     * EN: Converts data to JSON string for export.
     *
     * @param value - TR: Export edilecek değer / EN: Value to export
     * @returns TR: JSON string veya null / EN: JSON string or null
     */
    override toExport(value: Record<string, unknown> | null): string | null {
        if (value == null) return null;
        try {
            return JSON.stringify(value);
        } catch {
            return null;
        }
    }

    /**
     * TR: Dış kaynaktan gelen veriyi (Import) işler.
     * Hem string formatındaki JSON'u hem de halihazırda obje olan veriyi kabul eder.
     * Array formatındaki JSON köklerini reddeder (sadece Object kabul eder).
     *
     * EN: Processes data from an external source (Import).
     * Accepts both JSON in string format and data that is already an object.
     * Rejects JSON roots in Array format (accepts only Object).
     *
     * @param raw - TR: Ham import verisi / EN: Raw import data
     * @returns TR: Parse edilmiş obje veya null / EN: Parsed object or null
     */
    override fromImport(raw: unknown): Record<string, unknown> | null {
        if (raw == null || raw === '') return null;

        // TR: Zaten bir obje ise (ve array değilse)
        // EN: If already an object (and not an array)
        if (typeof raw === 'object' && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }

        // TR: JSON string parse denemesi
        // EN: JSON string parse attempt
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    // ===========================================================================
    // TR: Yardımcı Metodlar
    // EN: Helper Methods
    // ===========================================================================

    /**
     * TR: Veriyi config içinde tanımlanan özel şemaya (varsa) göre doğrular.
     * Text editor'deki anlık değişiklikleri kontrol etmek için kullanılır.
     *
     * EN: Validates data against the custom schema defined in config (if any).
     * Used to check instant changes in the text editor.
     *
     * @param value - TR: Kontrol edilecek veri / EN: Data to check
     * @returns TR: Validasyon sonucu ve varsa hata mesajı / EN: Validation result and error message if any
     *
     * @example
     * ```typescript
     * const result = jsonField.validateJson(userData);
     * if (!result.valid) {
     *   console.error(result.error);
     * }
     * ```
     */
    validateJson(value: unknown): { valid: boolean; error?: string } {
        if (this.config.schema) {
            const result = this.config.schema.safeParse(value);
            if (!result.success) {
                return {
                    valid: false,
                    error: result.error.errors[0]?.message ?? 'Geçersiz JSON yapısı',
                };
            }
        }
        return { valid: true };
    }

    /**
     * TR: Bir string'i güvenli bir şekilde JSON objesine parse eder.
     * Array veya Primitive tipleri reddeder, sadece Object yapısını kabul eder.
     *
     * EN: Safely parses a string into a JSON object.
     * Rejects Array or Primitive types, accepts only Object structure.
     *
     * @param str - TR: Parse edilecek JSON string / EN: JSON string to parse
     * @returns TR: Parse sonucu ve varsa hata / EN: Parse result and error if any
     *
     * @example
     * ```typescript
     * const { value, error } = jsonField.parseJsonString('{"name": "test"}');
     * if (error) {
     *   console.error(error);
     * } else {
     *   state.value.set(value!);
     * }
     * ```
     */
    parseJsonString(str: string): { value: Record<string, unknown> | null; error?: string } {
        try {
            const parsed = JSON.parse(str);
            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                return { value: null, error: 'JSON bir obje olmalı' };
            }
            return { value: parsed };
        } catch {
            return { value: null, error: 'Geçersiz JSON formatı' };
        }
    }

    /**
     * TR: Dot notation kullanarak derin veri okur.
     * Örn: getValue(data, 'user.address.city')
     *
     * EN: Reads deep data using dot notation.
     * E.g., getValue(data, 'user.address.city')
     *
     * @param obj - TR: Kaynak obje / EN: Source object
     * @param path - TR: Erişim yolu (örn: 'a.b.c') / EN: Access path (e.g., 'a.b.c')
     * @returns TR: Bulunan değer veya undefined / EN: Found value or undefined
     *
     * @example
     * ```typescript
     * const user = { profile: { name: 'John', address: { city: 'NYC' } } };
     * const city = jsonField.getValue(user, 'profile.address.city');
     * // city = 'NYC'
     * ```
     */
    getValue<T>(obj: Record<string, unknown> | null, path: string): T | undefined {
        if (!obj) return undefined;

        const keys = path.split('.');
        let current: unknown = obj;

        for (const key of keys) {
            if (current == null || typeof current !== 'object') {
                return undefined;
            }
            current = (current as Record<string, unknown>)[key];
        }

        return current as T;
    }

    /**
     * TR: Dot notation kullanarak veriyi günceller ve YENİ bir obje döndürür (Immutable).
     * Orijinal objeyi değiştirmez, Angular OnPush stratejisi ile uyumludur.
     *
     * EN: Updates data using dot notation and returns a NEW object (Immutable).
     * Does not modify the original object, compatible with Angular OnPush strategy.
     *
     * @param obj - TR: Kaynak obje / EN: Source object
     * @param path - TR: Güncellenecek yol / EN: Path to update
     * @param value - TR: Yeni değer / EN: New value
     * @returns TR: Güncellenmiş yeni obje / EN: Updated new object
     *
     * @example
     * ```typescript
     * const user = { name: 'John', address: { city: 'NYC' } };
     * const updated = jsonField.setValue(user, 'address.city', 'LA');
     * // updated = { name: 'John', address: { city: 'LA' } }
     * // user değişmedi (immutable)
     * ```
     */
    setValue(
        obj: Record<string, unknown> | null,
        path: string,
        value: unknown
    ): Record<string, unknown> {
        const result = { ...(obj ?? {}) };
        const keys = path.split('.');
        let current: Record<string, unknown> = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            // TR: Yol yoksa veya obje değilse yeni obje oluştur
            // EN: Create new object if path doesn't exist or not an object
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            } else {
                // TR: Shallow copy ile referansı kopar (Immutability)
                // EN: Break reference with shallow copy (Immutability)
                current[key] = { ...(current[key] as Record<string, unknown>) };
            }
            current = current[key] as Record<string, unknown>;
        }

        current[keys[keys.length - 1]] = value;
        return result;
    }

    /**
     * TR: Objenin en üst seviyedeki anahtarlarını listeler.
     *
     * EN: Lists the top-level keys of the object.
     *
     * @param obj - TR: Kaynak obje / EN: Source object
     * @returns TR: Anahtar listesi / EN: List of keys
     */
    getKeys(obj: Record<string, unknown> | null): string[] {
        if (!obj) return [];
        return Object.keys(obj);
    }

    /**
     * TR: İki JSON objesini derin karşılaştırır.
     *
     * EN: Deep compares two JSON objects.
     *
     * @param a - TR: İlk obje / EN: First object
     * @param b - TR: İkinci obje / EN: Second object
     * @returns TR: Eşit ise true / EN: True if equal
     */
    isEqual(
        a: Record<string, unknown> | null,
        b: Record<string, unknown> | null
    ): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * TR: JSON objesinin derin kopyasını oluşturur.
     *
     * EN: Creates a deep copy of the JSON object.
     *
     * @param obj - TR: Kopyalanacak obje / EN: Object to copy
     * @returns TR: Derin kopya / EN: Deep copy
     */
    clone(obj: Record<string, unknown> | null): Record<string, unknown> | null {
        if (obj == null) return null;
        return JSON.parse(JSON.stringify(obj));
    }
}