import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Sayısal değer girişi için kullanılan NumberField sınıfı.
 * Tam sayı ve ondalıklı sayılar için kullanılabilir.
 *
 * EN: NumberField class used for numeric value input.
 * Can be used for integers and decimal numbers.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: NumberField için genişletilmiş yapılandırma seçenekleri.
 * Sayısal değer sınırları ve format ayarları içerir.
 *
 * EN: Extended configuration options for NumberField.
 * Contains numeric value limits and format settings.
 */
export interface NumberFieldConfig extends FieldConfig {
    /**
     * TR: Minimum değer. Değer bundan küçük olamaz.
     * EN: Minimum value. Value cannot be less than this.
     */
    min?: number;

    /**
     * TR: Maksimum değer. Değer bundan büyük olamaz.
     * EN: Maximum value. Value cannot be greater than this.
     */
    max?: number;

    /**
     * TR: Sadece tam sayı kabul edilsin mi?
     * EN: Should only integers be accepted?
     * @default false
     */
    integer?: boolean;

    /**
     * TR: Sadece pozitif değerler kabul edilsin mi?
     * EN: Should only positive values be accepted?
     * @default false
     */
    positive?: boolean;

    /**
     * TR: Sadece negatif değerler kabul edilsin mi?
     * EN: Should only negative values be accepted?
     * @default false
     */
    negative?: boolean;

    /**
     * TR: Ondalık basamak sayısı (gösterim için).
     * EN: Number of decimal places (for display).
     * @default 2
     */
    decimals?: number;

    /**
     * TR: Artış/azalış miktarı (step attribute için).
     * EN: Increment/decrement amount (for step attribute).
     */
    step?: number;

    /**
     * TR: Sayı formatı için locale (tr-TR, en-US vb.).
     * EN: Locale for number formatting (tr-TR, en-US, etc.).
     * @default 'tr-TR'
     */
    locale?: string;
}

/**
 * TR: Sayısal değer girişi için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - `min`: Minimum değer sınırı
 * - `max`: Maksimum değer sınırı
 * - `integer`: Sadece tam sayı
 * - `positive`: Sadece pozitif
 * - `negative`: Sadece negatif
 *
 * EN: Zignal field implementation for numeric value input.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - `min`: Minimum value limit
 * - `max`: Maximum value limit
 * - `integer`: Integer only
 * - `positive`: Positive only
 * - `negative`: Negative only
 *
 * @example
 * ```typescript
 * // Basit sayı alanı
 * const ageField = new NumberField('age', 'Yaş', {
 *   required: true,
 *   min: 0,
 *   max: 150,
 *   integer: true
 * });
 *
 * // Ondalıklı fiyat alanı
 * const priceField = new NumberField('price', 'Fiyat', {
 *   required: true,
 *   min: 0,
 *   positive: true,
 *   decimals: 2
 * });
 *
 * // Yüzde alanı
 * const rateField = new NumberField('rate', 'Oran', {
 *   min: 0,
 *   max: 100,
 *   step: 0.1
 * });
 * ```
 */
export class NumberField extends BaseField<number> {
    /**
     * TR: NumberField constructor'ı.
     *
     * EN: NumberField constructor.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı
     *               EN: Unique identifier of the field
     * @param label - TR: Kullanıcıya gösterilecek etiket
     *                EN: Label to display to user
     * @param config - TR: Number'a özgü yapılandırma seçenekleri
     *                 EN: Number-specific configuration options
     */
    constructor(
        name: string,
        label: string,
        public override readonly config: NumberFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Sayısal validasyon için Zod şemasını oluşturur.
     * Config'deki ayarlara göre dinamik olarak validasyon kuralları ekler.
     *
     * EN: Creates Zod schema for numeric validation.
     * Dynamically adds validation rules based on config settings.
     *
     * @returns TR: Yapılandırılmış Zod number şeması
     *          EN: Configured Zod number schema
     */
    schema(): z.ZodType<number> {
        let base = z.number({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        // TR: Tam sayı kontrolü
        // EN: Integer check
        if (this.config.integer) {
            base = base.int(t('number.integer'));
        }

        // TR: Pozitif sayı kontrolü
        // EN: Positive number check
        if (this.config.positive) {
            base = base.positive(t('number.positive'));
        }

        // TR: Negatif sayı kontrolü
        // EN: Negative number check
        if (this.config.negative) {
            base = base.negative(t('number.negative'));
        }

        // TR: Minimum değer kontrolü
        // EN: Minimum value check
        if (this.config.min !== undefined) {
            base = base.min(this.config.min, t('number.min', { min: this.config.min }));
        }

        // TR: Maksimum değer kontrolü
        // EN: Maximum value check
        if (this.config.max !== undefined) {
            base = base.max(
                this.config.max,
                t('number.max', { max: this.config.max })
            );
        }

        return this.applyRequired(base);
    }

    /**
     * TR: Sayıyı kullanıcı dostu formatta gösterir.
     * Locale ayarına göre binlik ayracı ve ondalık gösterimi yapar.
     *
     * EN: Displays number in user-friendly format.
     * Applies thousand separators and decimal display based on locale setting.
     *
     * @param value - TR: Gösterilecek değer
     *                EN: Value to display
     * @returns TR: Formatlanmış sayı string'i
     *          EN: Formatted number string
     */
    override present(value: number | null): string {
        if (value == null) return '-';

        const locale = this.config.locale ?? 'tr-TR';
        const decimals = this.config.decimals ?? 2;

        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: this.config.integer ? 0 : undefined,
            maximumFractionDigits: this.config.integer ? 0 : decimals,
        }).format(value);
    }

    /**
     * TR: Dış kaynaktan gelen veriyi number'a dönüştürür.
     * String değerler parse edilir, virgül nokta'ya çevrilir.
     *
     * EN: Converts data from external source to number.
     * String values are parsed, comma is converted to dot.
     *
     * @param raw - TR: Ham veri
     *              EN: Raw data
     * @returns TR: Number değer veya null
     *          EN: Number value or null
     */
    override fromImport(raw: unknown): number | null {
        if (raw == null) return null;

        // TR: Zaten number ise direkt kullan
        // EN: Use directly if already number
        if (typeof raw === 'number') {
            if (isNaN(raw)) return null;
            return this.schema().safeParse(raw).success ? raw : null;
        }

        // TR: String ise parse et
        // EN: Parse if string
        if (typeof raw === 'string') {
            // TR: Türkçe format desteği (virgülü noktaya çevir)
            // EN: Turkish format support (convert comma to dot)
            const normalized = raw.replace(',', '.').replace(/\s/g, '');
            const num = parseFloat(normalized);

            if (isNaN(num)) return null;
            return this.schema().safeParse(num).success ? num : null;
        }

        return null;
    }

    /**
     * TR: Sayıyı API/export için hazırlar.
     * Her zaman number olarak döner, formatlama yapılmaz.
     *
     * EN: Prepares number for API/export.
     * Always returns as number, no formatting applied.
     *
     * @param value - TR: Export edilecek değer
     *                EN: Value to export
     * @returns TR: Number veya null
     *          EN: Number or null
     */
    override toExport(value: number | null): number | null {
        return value;
    }
}