import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig } from '../core/interfaces';
import { SelectOption } from './select.field';

/**
 * @fileoverview
 * TR: Çoklu seçim için MultiselectField sınıfı.
 * Birden fazla seçeneğin seçilebileceği dropdown/chip bileşeni için.
 *
 * EN: MultiselectField class for multiple selection.
 * For dropdown/chip component where multiple options can be selected.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: MultiselectField için genişletilmiş yapılandırma seçenekleri.
 *
 * EN: Extended configuration options for MultiselectField.
 *
 * @template T - TR: Seçenek değerlerinin tipi
 *               EN: Type of option values
 */
export interface MultiselectFieldConfig<T = unknown> extends FieldConfig {
  /**
   * TR: Seçilebilir seçenekler listesi.
   * EN: List of selectable options.
   */
  options: SelectOption<T>[];

  /**
   * TR: Minimum seçim sayısı.
   * EN: Minimum selection count.
   */
  minSelections?: number;

  /**
   * TR: Maksimum seçim sayısı.
   * EN: Maximum selection count.
   */
  maxSelections?: number;

  /**
   * TR: Aranabilir mi?
   * EN: Is searchable?
   * @default false
   */
  searchable?: boolean;

  /**
   * TR: Tümünü seç butonu gösterilsin mi?
   * EN: Should select all button be shown?
   * @default false
   */
  showSelectAll?: boolean;

  /**
   * TR: Chip olarak mı gösterilsin?
   * EN: Should be shown as chips?
   * @default true
   */
  showAsChips?: boolean;
}

/**
 * TR: Çoklu seçim için Zignal alan implementasyonu.
 *
 * Özellikler:
 * - Birden fazla seçenek seçme
 * - Min/Max seçim sınırı
 * - Arama desteği
 * - Tümünü seç özelliği
 * - Chip veya liste görünümü
 *
 * EN: Zignal field implementation for multiple selection.
 *
 * Features:
 * - Select multiple options
 * - Min/Max selection limits
 * - Search support
 * - Select all feature
 * - Chip or list view
 *
 * @template T - TR: Seçenek değerlerinin tipi
 *               EN: Type of option values
 *
 * @example
 * ```typescript
 * // Basit kullanım
 * const tagsField = new MultiselectField('tags', 'Etiketler', {
 *   options: [
 *     { value: 'js', label: 'JavaScript' },
 *     { value: 'ts', label: 'TypeScript' },
 *     { value: 'ng', label: 'Angular' }
 *   ]
 * });
 *
 * // Sınırlı seçim
 * const skillsField = new MultiselectField('skills', 'Yetenekler', {
 *   options: [...],
 *   minSelections: 1,
 *   maxSelections: 5,
 *   required: true
 * });
 *
 * // Enum ile kullanım
 * enum Permission { Read = 'read', Write = 'write', Delete = 'delete' }
 *
 * const permissionsField = new MultiselectField<Permission>('permissions', 'İzinler', {
 *   options: [
 *     { value: Permission.Read, label: 'Okuma' },
 *     { value: Permission.Write, label: 'Yazma' },
 *     { value: Permission.Delete, label: 'Silme' }
 *   ],
 *   showSelectAll: true
 * });
 * ```
 */
export class MultiselectField<T = string> extends BaseField<T[]> {
  /**
   * TR: MultiselectField constructor'ı.
   *
   * EN: MultiselectField constructor.
   *
   * @param name - TR: Alanın benzersiz tanımlayıcısı
   *               EN: Unique identifier of the field
   * @param label - TR: Kullanıcıya gösterilecek etiket
   *                EN: Label to display to user
   * @param config - TR: Multiselect'e özgü yapılandırma seçenekleri
   *                 EN: Multiselect-specific configuration options
   */
  constructor(
    name: string,
    label: string,
    public override readonly config: MultiselectFieldConfig<T>
  ) {
    super(name, label, config);
  }

  /**
   * TR: Multiselect validasyonu için Zod şemasını oluşturur.
   * Seçim sayısı ve geçerli değer kontrolü yapar.
   *
   * EN: Creates Zod schema for multiselect validation.
   * Validates selection count and valid values.
   *
   * @returns TR: Yapılandırılmış Zod array şeması
   *          EN: Configured Zod array schema
   */
  schema(): z.ZodType<T[]> {
    const validValues = this.config.options
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.value);

    // TR: Her elemanın geçerli olduğunu kontrol et
    // EN: Check that each element is valid
    let base = z.array(
      z.custom<T>(
        (val) => validValues.includes(val as T),
        { message: 'Geçersiz seçenek' }
      )
    );

    // TR: Minimum seçim sayısı
    // EN: Minimum selection count
    if (this.config.minSelections !== undefined) {
      base = base.min(
        this.config.minSelections,
        `En az ${this.config.minSelections} seçenek seçmelisiniz`
      );
    }

    // TR: Maksimum seçim sayısı
    // EN: Maximum selection count
    if (this.config.maxSelections !== undefined) {
      base = base.max(
        this.config.maxSelections,
        `En fazla ${this.config.maxSelections} seçenek seçebilirsiniz`
      );
    }

    return this.applyRequired(base) as z.ZodType<T[]>;
  }

  /**
   * TR: Seçili değerlerin label'larını virgülle ayırarak gösterir.
   *
   * EN: Displays labels of selected values separated by comma.
   *
   * @param value - TR: Seçili değerler dizisi
   *                EN: Array of selected values
   * @returns TR: Virgülle ayrılmış label'lar
   *          EN: Comma-separated labels
   */
  override present(value: T[] | null): string {
    if (value == null || value.length === 0) return '-';

    const labels = value.map((v) => {
      const option = this.config.options.find((opt) => opt.value === v);
      return option?.label ?? String(v);
    });

    return labels.join(', ');
  }

  /**
   * TR: Dış kaynaktan gelen veriyi T[] dizisine dönüştürür.
   *
   * EN: Converts data from external source to T[] array.
   *
   * @param raw - TR: Ham veri
   *              EN: Raw data
   * @returns TR: Değer dizisi veya null
   *          EN: Value array or null
   */
  override fromImport(raw: unknown): T[] | null {
    if (raw == null) return null;

    // TR: Zaten dizi ise
    // EN: If already array
    if (Array.isArray(raw)) {
      const validValues: T[] = [];
      for (const item of raw) {
        const option = this.config.options.find(
          (opt) => opt.value === item || opt.label === item
        );
        if (option) {
          validValues.push(option.value);
        }
      }
      return validValues.length > 0 ? validValues : null;
    }

    // TR: Virgülle ayrılmış string
    // EN: Comma-separated string
    if (typeof raw === 'string') {
      const items = raw.split(',').map((s) => s.trim());
      return this.fromImport(items);
    }

    return null;
  }

  /**
   * TR: Filtreleme önizlemesi için kısa metin oluşturur.
   *
   * EN: Creates short text for filter preview.
   *
   * @param value - TR: Seçili değerler
   *                EN: Selected values
   * @returns TR: Kısa önizleme veya null
   *          EN: Short preview or null
   */
  override filterPreview(value: T[] | null): string | null {
    if (value == null || value.length === 0) return null;

    if (value.length === 1) {
      const option = this.config.options.find((opt) => opt.value === value[0]);
      return option?.label ?? String(value[0]);
    }

    return `${value.length} seçili`;
  }

  // ===========================================================================
  // TR: Yardımcı Metodlar
  // EN: Helper Methods
  // ===========================================================================

  /**
   * TR: Tüm seçenekleri döndürür.
   *
   * EN: Returns all options.
   */
  getOptions(): SelectOption<T>[] {
    return this.config.options;
  }

  /**
   * TR: Aktif (disabled olmayan) seçenekleri döndürür.
   *
   * EN: Returns active (not disabled) options.
   */
  getActiveOptions(): SelectOption<T>[] {
    return this.config.options.filter((opt) => !opt.disabled);
  }

  /**
   * TR: Belirli bir değerin seçili olup olmadığını kontrol eder.
   *
   * EN: Checks if a specific value is selected.
   *
   * @param selectedValues - TR: Seçili değerler
   *                         EN: Selected values
   * @param value - TR: Kontrol edilecek değer
   *                EN: Value to check
   */
  isSelected(selectedValues: T[], value: T): boolean {
    return selectedValues.includes(value);
  }

  /**
   * TR: Maksimum seçim sayısına ulaşılıp ulaşılmadığını kontrol eder.
   *
   * EN: Checks if maximum selection count has been reached.
   *
   * @param selectedCount - TR: Mevcut seçim sayısı
   *                        EN: Current selection count
   */
  isMaxReached(selectedCount: number): boolean {
    if (this.config.maxSelections === undefined) return false;
    return selectedCount >= this.config.maxSelections;
  }

  /**
   * TR: Tüm aktif seçeneklerin değerlerini döndürür.
   *
   * EN: Returns values of all active options.
   */
  getAllValues(): T[] {
    return this.getActiveOptions().map((opt) => opt.value);
  }
}
