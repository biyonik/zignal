import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Evet/Hayır (true/false) değerler için BooleanField sınıfı.
 * Checkbox, toggle veya radio button olarak render edilebilir.
 *
 * EN: BooleanField class for Yes/No (true/false) values.
 * Can be rendered as checkbox, toggle, or radio button.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: BooleanField için genişletilmiş yapılandırma seçenekleri.
 *
 * EN: Extended configuration options for BooleanField.
 */
export interface BooleanFieldConfig extends FieldConfig {
    /**
     * TR: true değeri için gösterilecek etiket.
     * EN: Label to display for true value.
     * @default 'Evet'
     */
    trueLabel?: string;

    /**
     * TR: false değeri için gösterilecek etiket.
     * EN: Label to display for false value.
     * @default 'Hayır'
     */
    falseLabel?: string;

    /**
     * TR: UI bileşen tipi (checkbox, toggle, radio).
     * EN: UI component type (checkbox, toggle, radio).
     * @default 'checkbox'
     */
    displayAs?: 'checkbox' | 'toggle' | 'radio';

    /**
     * TR: Varsayılan değer. Belirtilmezse false kullanılır.
     * EN: Default value. Uses false if not specified.
     * @default false
     */
    defaultValue?: boolean;
}

/**
 * TR: Boolean (Evet/Hayır) değerler için Zignal alan implementasyonu.
 *
 * Kullanım alanları:
 * - Onay kutuları (Terms & Conditions, Newsletter vb.)
 * - Toggle switch'ler (Aktif/Pasif, Görünür/Gizli vb.)
 * - Evet/Hayır soruları
 *
 * EN: Zignal field implementation for Boolean (Yes/No) values.
 *
 * Use cases:
 * - Checkboxes (Terms & Conditions, Newsletter, etc.)
 * - Toggle switches (Active/Inactive, Visible/Hidden, etc.)
 * - Yes/No questions
 *
 * @example
 * ```typescript
 * // Basit checkbox
 * const acceptTerms = new BooleanField('acceptTerms', 'Şartları kabul ediyorum', {
 *   required: true
 * });
 *
 * // Toggle switch
 * const isActive = new BooleanField('isActive', 'Aktif', {
 *   displayAs: 'toggle',
 *   defaultValue: true
 * });
 *
 * // Özel etiketlerle
 * const hasInsurance = new BooleanField('hasInsurance', 'Sigorta Durumu', {
 *   trueLabel: 'Sigortalı',
 *   falseLabel: 'Sigortasız',
 *   displayAs: 'radio'
 * });
 * ```
 */
export class BooleanField extends BaseField<boolean> {
    /**
     * TR: BooleanField constructor'ı.
     *
     * EN: BooleanField constructor.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı
     *               EN: Unique identifier of the field
     * @param label - TR: Kullanıcıya gösterilecek etiket
     *                EN: Label to display to user
     * @param config - TR: Boolean'a özgü yapılandırma seçenekleri
     *                 EN: Boolean-specific configuration options
     */
    constructor(
        name: string,
        label: string,
        public override readonly config: BooleanFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Boolean validasyonu için Zod şemasını oluşturur.
     *
     * Not: `required: true` durumunda değerin `true` olması zorunludur.
     * Bu, "Şartları kabul ediyorum" gibi alanlar için kullanışlıdır.
     *
     * EN: Creates Zod schema for boolean validation.
     *
     * Note: When `required: true`, the value must be `true`.
     * This is useful for fields like "I accept the terms".
     *
     * @returns TR: Yapılandırılmış Zod boolean şeması
     *          EN: Configured Zod boolean schema
     */
    schema(): z.ZodType<boolean> {
        let base = z.boolean({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        // TR: required durumunda değer true olmalı
        // EN: Value must be true when required
        if (this.config.required) {
            return base.refine((val) => val === true, {
                message: t('boolean.required'),
            });
        }

        return base;
    }

    /**
     * TR: Boolean değeri kullanıcı dostu formatta gösterir.
     * Config'deki trueLabel/falseLabel değerlerini kullanır.
     *
     * EN: Displays boolean value in user-friendly format.
     * Uses trueLabel/falseLabel values from config.
     *
     * @param value - TR: Gösterilecek değer
     *                EN: Value to display
     * @returns TR: true/false için karşılık gelen etiket
     *          EN: Corresponding label for true/false
     */
    override present(value: boolean | null): string {
        if (value == null) return '-';

        const trueLabel = this.config.trueLabel ?? 'Evet';
        const falseLabel = this.config.falseLabel ?? 'Hayır';

        return value ? trueLabel : falseLabel;
    }

    /**
     * TR: Dış kaynaktan gelen veriyi boolean'a dönüştürür.
     * String 'true'/'false', sayı 1/0 gibi değerleri de kabul eder.
     *
     * EN: Converts data from external source to boolean.
     * Also accepts string 'true'/'false', number 1/0 values.
     *
     * @param raw - TR: Ham veri
     *              EN: Raw data
     * @returns TR: Boolean değer veya null
     *          EN: Boolean value or null
     */
    override fromImport(raw: unknown): boolean | null {
        if (raw == null) return null;

        // TR: Zaten boolean ise direkt kullan
        // EN: Use directly if already boolean
        if (typeof raw === 'boolean') {
            return raw;
        }

        // TR: String 'true'/'false' kontrolü
        // EN: String 'true'/'false' check
        if (typeof raw === 'string') {
            const normalized = raw.toLowerCase().trim();
            if (normalized === 'true' || normalized === '1' || normalized === 'evet') {
                return true;
            }
            if (normalized === 'false' || normalized === '0' || normalized === 'hayır') {
                return false;
            }
            return null;
        }

        // TR: Sayı 1/0 kontrolü
        // EN: Number 1/0 check
        if (typeof raw === 'number') {
            if (raw === 1) return true;
            if (raw === 0) return false;
            return null;
        }

        return null;
    }

    /**
     * TR: Boolean değeri export için hazırlar.
     *
     * EN: Prepares boolean value for export.
     *
     * @param value - TR: Export edilecek değer
     *                EN: Value to export
     * @returns TR: Boolean değer
     *          EN: Boolean value
     */
    override toExport(value: boolean | null): boolean | null {
        return value;
    }
}