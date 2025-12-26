import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Tek satır metin girişi için kullanılan StringField sınıfı.
 * E-posta, kullanıcı adı, telefon gibi kısa metin verileri için idealdir.
 *
 * EN: StringField class used for single-line text input.
 * Ideal for short text data like email, username, phone.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: StringField için genişletilmiş yapılandırma seçenekleri.
 * Temel FieldConfig'e ek olarak metin validasyonu için özel ayarlar içerir.
 *
 * EN: Extended configuration options for StringField.
 * Contains special settings for text validation in addition to base FieldConfig.
 */
export interface StringFieldConfig extends FieldConfig {
    /**
     * TR: Minimum karakter sayısı. Belirtilirse validasyonda kontrol edilir.
     * EN: Minimum character count. Checked in validation if specified.
     */
    minLength?: number;

    /**
     * TR: Maksimum karakter sayısı. Belirtilirse validasyonda kontrol edilir.
     * EN: Maximum character count. Checked in validation if specified.
     */
    maxLength?: number;

    /**
     * TR: Regex pattern. Değer bu pattern'e uymalıdır.
     * EN: Regex pattern. Value must match this pattern.
     */
    pattern?: RegExp;

    /**
     * TR: Pattern uyumsuzluğunda gösterilecek hata mesajı.
     * EN: Error message to show on pattern mismatch.
     */
    patternMessage?: string;

    /**
     * TR: E-posta formatı kontrolü aktif mi?
     * EN: Is email format validation active?
     */
    email?: boolean;

    /**
     * TR: URL formatı kontrolü aktif mi?
     * EN: Is URL format validation active?
     */
    url?: boolean;

    /**
     * TR: Değeri otomatik trim et.
     * EN: Automatically trim value.
     * @default false
     */
    trim?: boolean;

    /**
     * TR: Küçük harfe dönüştür.
     * EN: Convert to lowercase.
     * @default false
     */
    lowercase?: boolean;

    /**
     * TR: Büyük harfe dönüştür.
     * EN: Convert to uppercase.
     * @default false
     */
    uppercase?: boolean;
}

/**
 * TR: Tek satır metin girişi için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - `minLength`: Minimum karakter sayısı
 * - `maxLength`: Maksimum karakter sayısı
 * - `pattern`: Regex pattern eşleşmesi
 * - `email`: E-posta formatı kontrolü
 * - `url`: URL formatı kontrolü
 *
 * EN: Zignal field implementation for single-line text input.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - `minLength`: Minimum character count
 * - `maxLength`: Maximum character count
 * - `pattern`: Regex pattern matching
 * - `email`: Email format validation
 * - `url`: URL format validation
 *
 * @example
 * ```typescript
 * // Basit kullanım
 * const nameField = new StringField('name', 'İsim', { required: true });
 *
 * // E-posta validasyonu ile
 * const emailField = new StringField('email', 'E-posta', {
 *   required: true,
 *   email: true
 * });
 *
 * // Karakter sınırı ile
 * const usernameField = new StringField('username', 'Kullanıcı Adı', {
 *   required: true,
 *   minLength: 3,
 *   maxLength: 20,
 *   pattern: /^[a-z0-9_]+$/,
 *   patternMessage: 'Sadece küçük harf, rakam ve alt çizgi kullanılabilir'
 * });
 * ```
 */
export class StringField extends BaseField<string> {
    readonly type = 'string'
    /**
     * TR: StringField constructor'ı.
     *
     * EN: StringField constructor.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı
     *               EN: Unique identifier of the field
     * @param label - TR: Kullanıcıya gösterilecek etiket
     *                EN: Label to display to user
     * @param config - TR: String'e özgü yapılandırma seçenekleri
     *                 EN: String-specific configuration options
     */
    constructor(
        name: string,
        label: string,
        public override readonly config: StringFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: String validasyonu için Zod şemasını oluşturur.
     * Config'deki ayarlara göre dinamik olarak validasyon kuralları ekler.
     *
     * Uygulanan kurallar sırası:
     * 1. Temel string tipi
     * 2. minLength (varsa)
     * 3. maxLength (varsa)
     * 4. email formatı (varsa)
     * 5. url formatı (varsa)
     * 6. pattern (varsa)
     * 7. required/optional (applyRequired ile)
     *
     * EN: Creates Zod schema for string validation.
     * Dynamically adds validation rules based on config settings.
     *
     * Applied rules order:
     * 1. Base string type
     * 2. minLength (if set)
     * 3. maxLength (if set)
     * 4. email format (if set)
     * 5. url format (if set)
     * 6. pattern (if set)
     * 7. required/optional (via applyRequired)
     *
     * @returns TR: Yapılandırılmış Zod string şeması
     *          EN: Configured Zod string schema
     */
    schema(): z.ZodType<string> {
        let base = z.string();

        const transforms: ((val: string) => string)[] = [];


        if (this.config.required) {
            base = base.min(1, t('required'));
        }

        if (this.config.trim) {
            transforms.push((val) => val.trim());
        }

        if (this.config.lowercase) {
            transforms.push((val) => val.toLowerCase());
        }

        if (this.config.uppercase) {
            transforms.push((val) => val.toUpperCase());
        }

        // TR: Minimum karakter kontrolü
        // EN: Minimum character check
        if (this.config.minLength !== undefined) {
            base = base.min(
                this.config.minLength,
                t('string.min', { min: this.config.minLength })
            );
        }

        // TR: Maksimum karakter kontrolü
        // EN: Maximum character check
        if (this.config.maxLength !== undefined) {
            base = base.max(
                this.config.maxLength,
                t('string.max', { max: this.config.maxLength })
            );
        }

        // TR: E-posta formatı kontrolü
        // EN: Email format check
        if (this.config.email) {
            base = base.email(t('string.email'));
        }

        // TR: URL formatı kontrolü
        // EN: URL format check
        if (this.config.url) {
            base = base.url(t('string.url'));
        }

        // TR: Regex pattern kontrolü
        // EN: Regex pattern check
        if (this.config.pattern) {
            base = base.regex(
                this.config.pattern,
                this.config.patternMessage ?? t('string.pattern')
            );
        }

        const processed = z.preprocess((val) => {
            if (val === null || val === undefined) return '';
            let result = String(val);
            for (const transform of transforms) {
                result = transform(result);
            }
            return result;
        }, base);

        return this.applyRequired(processed);
    }

    /**
     * TR: Boş string'leri de handle ederek değeri sunar.
     *
     * EN: Presents the value while handling empty strings.
     *
     * @param value - TR: Gösterilecek değer
     *                EN: Value to display
     * @returns TR: Kullanıcı dostu gösterim
     *          EN: User-friendly display
     */
    override present(value: string | null): string {
        if (value == null || value === '') return '-';
        return value;
    }

    /**
     * TR: Dış kaynaktan gelen veriyi string'e dönüştürür.
     * Sayı ve boolean değerleri otomatik string'e çevirir.
     *
     * EN: Converts data from external source to string.
     * Automatically converts number and boolean values to string.
     *
     * @param raw - TR: Ham veri
     *              EN: Raw data
     * @returns TR: String değer veya null
     *          EN: String value or null
     */
    override fromImport(raw: unknown): string | null {
        if (raw == null) return null;

        // TR: String ise direkt kullan
        // EN: Use directly if string
        if (typeof raw === 'string') {
            return this.schema().safeParse(raw).success ? raw : null;
        }

        // TR: Sayı veya boolean ise string'e çevir
        // EN: Convert to string if number or boolean
        if (typeof raw === 'number' || typeof raw === 'boolean') {
            const str = String(raw);
            return this.schema().safeParse(str).success ? str : null;
        }

        return null;
    }
}