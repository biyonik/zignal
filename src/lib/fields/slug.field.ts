import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * TR: URL-friendly slug alanı.
 * Otomatik olarak küçük harf, tire ile kelime ayırma yapar.
 *
 * EN: URL-friendly slug field.
 * Automatically converts to lowercase with hyphen word separation.
 */
export interface SlugFieldConfig extends FieldConfig {
    /**
     * TR: Minimum karakter sayısı.
     * EN: Minimum character count.
     */
    minLength?: number;

    /**
     * TR: Maksimum karakter sayısı.
     * EN: Maximum character count.
     */
    maxLength?: number;

    /**
     * TR: Otomatik slug dönüşümü yap.
     * EN: Auto convert to slug format.
     * @default true
     */
    autoFormat?: boolean;

    /**
     * TR: Prefix ekle (örn: 'blog-').
     * EN: Add prefix (e.g., 'blog-').
     */
    prefix?: string;

    /**
     * TR: Suffix ekle (örn: '-post').
     * EN: Add suffix (e.g., '-post').
     */
    suffix?: string;
}

export class SlugField extends BaseField<string> {
    readonly type = 'slug';

    private readonly SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    constructor(
        name: string,
        label: string,
        public override readonly config: SlugFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<string> {
        let base = z.string();

        if (this.config.required) {
            base = base.min(1, t('required'));
        }

        if (this.config.minLength !== undefined) {
            base = base.min(this.config.minLength, t('string.min', { min: this.config.minLength }));
        }

        if (this.config.maxLength !== undefined) {
            base = base.max(this.config.maxLength, t('string.max', { max: this.config.maxLength }));
        }

        base = base.regex(this.SLUG_PATTERN, 'Sadece küçük harf, rakam ve tire kullanılabilir');

        const processed = z.preprocess((val) => {
            if (val === null || val === undefined) return '';
            let result = String(val);

            if (this.config.autoFormat !== false) {
                result = this.toSlug(result);
            }

            if (this.config.prefix) {
                result = this.config.prefix + result;
            }

            if (this.config.suffix) {
                result = result + this.config.suffix;
            }

            return result;
        }, base);

        return this.applyRequired(processed);
    }

    /**
     * TR: Metni slug formatına çevirir.
     * EN: Converts text to slug format.
     */
    toSlug(text: string): string {
        return text
            .toLowerCase()
            .trim()
            // Türkçe karakterleri dönüştür
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            // Özel karakterleri kaldır
            .replace(/[^a-z0-9\s-]/g, '')
            // Boşlukları tire yap
            .replace(/\s+/g, '-')
            // Çoklu tireleri tekle
            .replace(/-+/g, '-')
            // Baş ve sondaki tireleri kaldır
            .replace(/^-+|-+$/g, '');
    }

    override present(value: string | null): string {
        if (value == null || value === '') return '-';
        return value;
    }
}
