import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Tarih değerleri için kullanılan DateField sınıfı.
 * Datepicker UI bileşeni ile kullanılmak üzere tasarlanmıştır.
 *
 * EN: DateField class used for date values.
 * Designed to be used with datepicker UI component.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: DateField için genişletilmiş yapılandırma seçenekleri.
 * Tarih sınırları ve format ayarları içerir.
 *
 * EN: Extended configuration options for DateField.
 * Contains date limits and format settings.
 */
export interface DateFieldConfig extends FieldConfig {
    /**
     * TR: Minimum tarih. Bu tarihten önceki tarihler kabul edilmez.
     * EN: Minimum date. Dates before this are not accepted.
     */
    min?: Date;

    /**
     * TR: Maksimum tarih. Bu tarihten sonraki tarihler kabul edilmez.
     * EN: Maximum date. Dates after this are not accepted.
     */
    max?: Date;

    /**
     * TR: Gösterim formatı. Intl.DateTimeFormat options.
     * EN: Display format. Intl.DateTimeFormat options.
     * @default { day: '2-digit', month: '2-digit', year: 'numeric' }
     */
    format?: Intl.DateTimeFormatOptions;

    /**
     * TR: Locale ayarı (tr-TR, en-US vb.).
     * EN: Locale setting (tr-TR, en-US, etc.).
     * @default 'tr-TR'
     */
    locale?: string;

    /**
     * TR: Bugünün tarihi minimum olarak kullanılsın mı?
     * EN: Should today's date be used as minimum?
     * @default false
     */
    minToday?: boolean;

    /**
     * TR: Bugünün tarihi maksimum olarak kullanılsın mı?
     * EN: Should today's date be used as maximum?
     * @default false
     */
    maxToday?: boolean;
}

/**
 * TR: Tarih değerleri için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - `min`: Minimum tarih sınırı
 * - `max`: Maksimum tarih sınırı
 * - `minToday`: Bugün veya sonrası
 * - `maxToday`: Bugün veya öncesi
 *
 * EN: Zignal field implementation for date values.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - `min`: Minimum date limit
 * - `max`: Maximum date limit
 * - `minToday`: Today or later
 * - `maxToday`: Today or earlier
 *
 * @example
 * ```typescript
 * // Doğum tarihi (geçmişte olmalı)
 * const birthDate = new DateField('birthDate', 'Doğum Tarihi', {
 *   required: true,
 *   maxToday: true
 * });
 *
 * // Randevu tarihi (gelecekte olmalı)
 * const appointmentDate = new DateField('appointmentDate', 'Randevu Tarihi', {
 *   required: true,
 *   minToday: true
 * });
 *
 * // Belirli tarih aralığı
 * const eventDate = new DateField('eventDate', 'Etkinlik Tarihi', {
 *   min: new Date('2024-01-01'),
 *   max: new Date('2024-12-31')
 * });
 * ```
 */
export class DateField extends BaseField<Date> {
    /**
     * TR: DateField constructor'ı.
     *
     * EN: DateField constructor.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı
     *               EN: Unique identifier of the field
     * @param label - TR: Kullanıcıya gösterilecek etiket
     *                EN: Label to display to user
     * @param config - TR: Date'e özgü yapılandırma seçenekleri
     *                 EN: Date-specific configuration options
     */
    constructor(
        name: string,
        label: string,
        public override readonly config: DateFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Tarih validasyonu için Zod şemasını oluşturur.
     * Config'deki ayarlara göre dinamik olarak validasyon kuralları ekler.
     *
     * EN: Creates Zod schema for date validation.
     * Dynamically adds validation rules based on config settings.
     *
     * @returns TR: Yapılandırılmış Zod date şeması
     *          EN: Configured Zod date schema
     */
    schema(): z.ZodType<Date> {
        let base = z.date({
            invalid_type_error: t('date.invalid'),
            required_error: t('required'),
        });

        // TR: Minimum tarih kontrolü
        // EN: Minimum date check
        const minDate = this.config.minToday
            ? this.getStartOfDay(new Date())
            : this.config.min;

        if (minDate) {
            base = base.min(minDate, t('date.min', { min: this.formatDate(minDate) }));
        }

        // TR: Maksimum tarih kontrolü
        // EN: Maximum date check
        const maxDate = this.config.maxToday
            ? this.getEndOfDay(new Date())
            : this.config.max;

        if (maxDate) {
            base = base.max(maxDate, t('date.max', { max: this.formatDate(maxDate) }));
        }

        return this.applyRequired(base);
    }

    /**
     * TR: Tarihi kullanıcı dostu formatta gösterir.
     * Locale ayarına göre formatlar.
     *
     * EN: Displays date in user-friendly format.
     * Formats according to locale setting.
     *
     * @param value - TR: Gösterilecek tarih
     *                EN: Date to display
     * @returns TR: Formatlanmış tarih string'i
     *          EN: Formatted date string
     */
    override present(value: Date | null): string {
        if (value == null) return '-';

        const locale = this.config.locale ?? 'tr-TR';
        const format = this.config.format ?? {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };

        return new Intl.DateTimeFormat(locale, format).format(value);
    }

    /**
     * TR: Tarihi API/export için ISO string formatına dönüştürür.
     *
     * EN: Converts date to ISO string format for API/export.
     *
     * @param value - TR: Export edilecek tarih
     *                EN: Date to export
     * @returns TR: ISO 8601 formatında string veya null
     *          EN: ISO 8601 format string or null
     */
    override toExport(value: Date | null): string | null {
        return value?.toISOString() ?? null;
    }

    /**
     * TR: Dış kaynaktan gelen veriyi Date objesine dönüştürür.
     * ISO string, timestamp ve Excel serial date formatlarını destekler.
     *
     * EN: Converts data from external source to Date object.
     * Supports ISO string, timestamp, and Excel serial date formats.
     *
     * @param raw - TR: Ham veri
     *              EN: Raw data
     * @returns TR: Date objesi veya null
     *          EN: Date object or null
     */
    override fromImport(raw: unknown): Date | null {
        if (raw == null) return null;

        // TR: Zaten Date ise direkt kullan
        // EN: Use directly if already Date
        if (raw instanceof Date) {
            return isNaN(raw.getTime()) ? null : raw;
        }

        // TR: String ise parse et (ISO 8601 veya locale format)
        // EN: Parse if string (ISO 8601 or locale format)
        if (typeof raw === 'string') {
            const date = new Date(raw);
            if (!isNaN(date.getTime())) {
                return this.schema().safeParse(date).success ? date : null;
            }

            // TR: Türkçe format desteği (DD.MM.YYYY)
            // EN: Turkish format support (DD.MM.YYYY)
            const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (trMatch) {
                const [, dayStr, monthStr, yearStr] = trMatch;
                const day = parseInt(dayStr);
                const month = parseInt(monthStr) - 1;
                const year = parseInt(yearStr);
                const parsed = new Date(year, month, day);

                // TR: JavaScript'in otomatik tarih taşmasını (overflow) kontrol et
                // EN: Check for JavaScript's automatic date overflow
                // Örn: 32.01.2024 -> 01.02.2024 olur, bu geçersiz kabul edilmeli
                if (
                    parsed.getDate() !== day ||
                    parsed.getMonth() !== month ||
                    parsed.getFullYear() !== year
                ) {
                    return null;
                }

                if (!isNaN(parsed.getTime())) {
                    return this.schema().safeParse(parsed).success ? parsed : null;
                }
            }

            return null;
        }

        // TR: Sayı ise timestamp veya Excel serial date olarak dene
        // EN: Try as timestamp or Excel serial date if number
        if (typeof raw === 'number') {
            // TR: Excel serial date kontrolü (1900'den itibaren gün sayısı)
            // EN: Excel serial date check (days since 1900)
            if (raw > 0 && raw < 2958466) {
                // 2958466 = 31.12.9999
                const excelDate = this.excelSerialToDate(raw);
                if (excelDate) {
                    return this.schema().safeParse(excelDate).success ? excelDate : null;
                }
            }

            // TR: Unix timestamp (milisaniye)
            // EN: Unix timestamp (milliseconds)
            const date = new Date(raw);
            if (!isNaN(date.getTime())) {
                return this.schema().safeParse(date).success ? date : null;
            }

            return null;
        }

        return null;
    }

    /**
     * TR: Excel serial date'i JavaScript Date'e dönüştürür.
     * Excel'de tarihler 1 Ocak 1900'den itibaren gün sayısı olarak tutulur.
     *
     * EN: Converts Excel serial date to JavaScript Date.
     * Excel stores dates as number of days since January 1, 1900.
     *
     * @param serial - TR: Excel serial date değeri
     *                 EN: Excel serial date value
     * @returns TR: Date objesi veya null
     *          EN: Date object or null
     * @private
     */
    private excelSerialToDate(serial: number): Date | null {
        // TR: Excel'in 1900 yılı leap year bug'ı için düzeltme
        // EN: Correction for Excel's 1900 leap year bug
        const excelEpoch = new Date(1899, 11, 30);
        const days = Math.floor(serial);
        const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * TR: Günün başlangıcını (00:00:00) döndürür.
     *
     * EN: Returns start of day (00:00:00).
     *
     * @param date - TR: Tarih
     *               EN: Date
     * @returns TR: Günün başlangıcı
     *          EN: Start of day
     * @private
     */
    private getStartOfDay(date: Date): Date {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    /**
     * TR: Günün sonunu (23:59:59.999) döndürür.
     *
     * EN: Returns end of day (23:59:59.999).
     *
     * @param date - TR: Tarih
     *               EN: Date
     * @returns TR: Günün sonu
     *          EN: End of day
     * @private
     */
    private getEndOfDay(date: Date): Date {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    /**
     * TR: Tarihi basit formatta string'e çevirir (hata mesajları için).
     *
     * EN: Converts date to simple format string (for error messages).
     *
     * @param date - TR: Tarih
     *               EN: Date
     * @returns TR: Formatlanmış string
     *          EN: Formatted string
     * @private
     */
    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat(this.config.locale ?? 'tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    }
}