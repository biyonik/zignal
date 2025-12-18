import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Dropdown/select bileşeni için SelectField sınıfı.
 * Önceden tanımlı seçenekler arasından tek seçim yapılmasını sağlar.
 *
 * EN: SelectField class for dropdown/select component.
 * Allows single selection from predefined options.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Select alanı için seçenek yapısı.
 * Her seçenek bir value (değer) ve label (etiket) içerir.
 *
 * EN: Option structure for select field.
 * Each option contains a value and label.
 *
 * @template T - TR: Seçenek değerinin tipi
 *               EN: Type of option value
 */
export interface SelectOption<T = unknown> {
    /**
     * TR: Seçeneğin değeri. Form submit'te bu değer gönderilir.
     * EN: Value of the option. This value is sent on form submit.
     */
    value: T;

    /**
     * TR: Kullanıcıya gösterilecek etiket.
     * EN: Label to display to user.
     */
    label: string;

    /**
     * TR: Seçenek devre dışı mı?
     * EN: Is option disabled?
     */
    disabled?: boolean;

    /**
     * TR: Seçenek grubu (optgroup için).
     * EN: Option group (for optgroup).
     */
    group?: string;
}

/**
 * TR: SelectField için genişletilmiş yapılandırma seçenekleri.
 *
 * EN: Extended configuration options for SelectField.
 *
 * @template T - TR: Seçenek değerlerinin tipi
 *               EN: Type of option values
 */
export interface SelectFieldConfig<T = unknown> extends FieldConfig {
    /**
     * TR: Seçilebilir seçenekler listesi.
     * EN: List of selectable options.
     */
    options: SelectOption<T>[];

    /**
     * TR: Aranabilir select mi? (autocomplete)
     * EN: Is it a searchable select? (autocomplete)
     * @default false
     */
    searchable?: boolean;

    /**
     * TR: Temizlenebilir mi? (clear button)
     * EN: Is it clearable? (clear button)
     * @default true
     */
    clearable?: boolean;

    /**
     * TR: Boş seçenek için gösterilecek placeholder.
     * EN: Placeholder to show for empty selection.
     * @default 'Seçiniz...'
     */
    emptyLabel?: string;
}

/**
 * TR: Dropdown/Select bileşeni için Zignal alan implementasyonu.
 *
 * Özellikler:
 * - Önceden tanımlı seçeneklerden tek seçim
 * - Value-Label mapping ile type-safe kullanım
 * - Opsiyonel arama (autocomplete) desteği
 * - Grup (optgroup) desteği
 *
 * EN: Zignal field implementation for dropdown/select component.
 *
 * Features:
 * - Single selection from predefined options
 * - Type-safe usage with value-label mapping
 * - Optional search (autocomplete) support
 * - Group (optgroup) support
 *
 * @template T - TR: Seçenek değerlerinin tipi (string, number, enum vb.)
 *               EN: Type of option values (string, number, enum, etc.)
 *
 * @example
 * ```typescript
 * // String seçenekler
 * const countryField = new SelectField('country', 'Ülke', {
 *   required: true,
 *   options: [
 *     { value: 'TR', label: 'Türkiye' },
 *     { value: 'US', label: 'Amerika' },
 *     { value: 'DE', label: 'Almanya' }
 *   ],
 *   searchable: true
 * });
 *
 * // Enum kullanımı
 * enum Status { Active = 'active', Inactive = 'inactive' }
 *
 * const statusField = new SelectField<Status>('status', 'Durum', {
 *   options: [
 *     { value: Status.Active, label: 'Aktif' },
 *     { value: Status.Inactive, label: 'Pasif' }
 *   ]
 * });
 *
 * // Gruplu seçenekler
 * const cityField = new SelectField('city', 'Şehir', {
 *   options: [
 *     { value: 'ist', label: 'İstanbul', group: 'Marmara' },
 *     { value: 'ank', label: 'Ankara', group: 'İç Anadolu' },
 *     { value: 'izm', label: 'İzmir', group: 'Ege' }
 *   ]
 * });
 * ```
 */
export class SelectField<T = string> extends BaseField<T> {
    readonly type = 'select';
    /**
     * TR: SelectField constructor'ı.
     *
     * EN: SelectField constructor.
     *
     * @param name - TR: Alanın benzersiz tanımlayıcısı
     *               EN: Unique identifier of the field
     * @param label - TR: Kullanıcıya gösterilecek etiket
     *                EN: Label to display to user
     * @param config - TR: Select'e özgü yapılandırma seçenekleri
     *                 EN: Select-specific configuration options
     */
    constructor(
        name: string,
        label: string,
        public override readonly config: SelectFieldConfig<T>
    ) {
        super(name, label, config);
    }

    /**
     * TR: Select validasyonu için Zod şemasını oluşturur.
     * Seçilen değerin options listesinde olup olmadığını kontrol eder.
     *
     * EN: Creates Zod schema for select validation.
     * Checks if selected value exists in options list.
     *
     * @returns TR: Yapılandırılmış Zod şeması
     *          EN: Configured Zod schema
     */
    schema(): z.ZodType<T> {
        const validValues = this.config.options
            .filter((opt) => !opt.disabled)
            .map((opt) => opt.value);

        // TR: Geçerli değerler listesiyle enum benzeri validasyon
        // EN: Enum-like validation with valid values list
        const base = z.custom<T>(
            (val) => validValues.includes(val as T),
            {
                message: t('select.invalid'),
            }
        );

        return this.applyRequired(base);
    }

    /**
     * TR: Seçili değerin label'ını gösterir.
     * Değer options listesinde bulunamazsa değerin kendisini gösterir.
     *
     * EN: Displays the label of selected value.
     * Shows the value itself if not found in options list.
     *
     * @param value - TR: Gösterilecek değer
     *                EN: Value to display
     * @returns TR: Seçeneğin label'ı veya değerin kendisi
     *          EN: Option's label or value itself
     */
    override present(value: T | null): string {
        if (value == null) return '-';

        const option = this.config.options.find((opt) => opt.value === value);
        return option?.label ?? String(value);
    }

    /**
     * TR: Dış kaynaktan gelen veriyi seçenek değerine dönüştürür.
     * Hem value hem de label ile eşleşme yapar.
     *
     * EN: Converts data from external source to option value.
     * Matches both by value and label.
     *
     * @param raw - TR: Ham veri
     *              EN: Raw data
     * @returns TR: Eşleşen seçenek değeri veya null
     *          EN: Matching option value or null
     */
    override fromImport(raw: unknown): T | null {
        if (raw == null) return null;

        // TR: Direkt value eşleşmesi
        // EN: Direct value match
        const byValue = this.config.options.find((opt) => opt.value === raw);
        if (byValue) return byValue.value;

        // TR: String ise label ile de eşleştir
        // EN: Also match by label if string
        if (typeof raw === 'string') {
            const byLabel = this.config.options.find(
                (opt) => opt.label.toLowerCase() === raw.toLowerCase()
            );
            if (byLabel) return byLabel.value;
        }

        return null;
    }

    /**
     * TR: Seçeneği filtreleme önizlemesi için hazırlar.
     *
     * EN: Prepares option for filter preview.
     *
     * @param value - TR: Önizlenecek değer
     *                EN: Value to preview
     * @returns TR: Seçenek label'ı veya null
     *          EN: Option label or null
     */
    override filterPreview(value: T | null): string | null {
        if (value == null) return null;
        return this.present(value);
    }

    // =========================================================================
    // TR: Yardımcı Metodlar
    // EN: Helper Methods
    // =========================================================================

    /**
     * TR: Tüm seçenekleri döndürür.
     *
     * EN: Returns all options.
     *
     * @returns TR: Seçenek listesi
     *          EN: Options list
     */
    getOptions(): SelectOption<T>[] {
        return this.config.options;
    }

    /**
     * TR: Aktif (disabled olmayan) seçenekleri döndürür.
     *
     * EN: Returns active (not disabled) options.
     *
     * @returns TR: Aktif seçenek listesi
     *          EN: Active options list
     */
    getActiveOptions(): SelectOption<T>[] {
        return this.config.options.filter((opt) => !opt.disabled);
    }

    /**
     * TR: Belirli bir değere ait seçeneği döndürür.
     *
     * EN: Returns option for specific value.
     *
     * @param value - TR: Aranacak değer
     *                EN: Value to search
     * @returns TR: Bulunan seçenek veya undefined
     *          EN: Found option or undefined
     */
    getOptionByValue(value: T): SelectOption<T> | undefined {
        return this.config.options.find((opt) => opt.value === value);
    }

    /**
     * TR: Seçenekleri gruplara göre gruplar.
     *
     * EN: Groups options by group.
     *
     * @returns TR: Grup adı -> seçenekler map'i
     *          EN: Group name -> options map
     */
    getGroupedOptions(): Map<string | undefined, SelectOption<T>[]> {
        const grouped = new Map<string | undefined, SelectOption<T>[]>();

        for (const option of this.config.options) {
            const group = option.group;
            if (!grouped.has(group)) {
                grouped.set(group, []);
            }
            grouped.get(group)!.push(option);
        }

        return grouped;
    }
}