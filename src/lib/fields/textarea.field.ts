import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig } from '../core';

/**
 * @fileoverview
 * TR: Çok satırlı metin girişi için TextareaField sınıfı.
 * Açıklama, yorum, adres gibi uzun metinler için idealdir.
 *
 * EN: TextareaField class for multi-line text input.
 * Ideal for long texts like description, comment, address.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: TextareaField için genişletilmiş yapılandırma seçenekleri.
 *
 * EN: Extended configuration options for TextareaField.
 */
export interface TextareaFieldConfig extends FieldConfig {
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
   * TR: Görünür satır sayısı (rows attribute).
   * EN: Number of visible rows (rows attribute).
   * @default 3
   */
  rows?: number;

  /**
   * TR: Otomatik boyutlandırma aktif mi?
   * EN: Is auto-resize enabled?
   * @default false
   */
  autoResize?: boolean;

  /**
   * TR: Karakter sayacı gösterilsin mi?
   * EN: Should character counter be shown?
   * @default false
   */
  showCharacterCount?: boolean;
}

/**
 * TR: Çok satırlı metin girişi için Zignal alan implementasyonu.
 *
 * StringField'dan farkı:
 * - Çok satırlı metin desteği
 * - rows, autoResize gibi textarea-specific özellikler
 * - Karakter sayacı desteği
 *
 * EN: Zignal field implementation for multi-line text input.
 *
 * Differences from StringField:
 * - Multi-line text support
 * - Textarea-specific features like rows, autoResize
 * - Character counter support
 *
 * @example
 * ```typescript
 * // Basit kullanım
 * const descriptionField = new TextareaField('description', 'Açıklama', {
 *   required: true,
 *   rows: 5
 * });
 *
 * // Karakter sınırlı
 * const bioField = new TextareaField('bio', 'Hakkımda', {
 *   maxLength: 500,
 *   showCharacterCount: true,
 *   autoResize: true
 * });
 *
 * // Adres alanı
 * const addressField = new TextareaField('address', 'Adres', {
 *   required: true,
 *   minLength: 10,
 *   maxLength: 200,
 *   rows: 3,
 *   placeholder: 'Tam adresinizi giriniz'
 * });
 * ```
 */
export class TextareaField extends BaseField<string> {
  /**
   * TR: TextareaField constructor'ı.
   *
   * EN: TextareaField constructor.
   *
   * @param name - TR: Alanın benzersiz tanımlayıcısı
   *               EN: Unique identifier of the field
   * @param label - TR: Kullanıcıya gösterilecek etiket
   *                EN: Label to display to user
   * @param config - TR: Textarea'ya özgü yapılandırma seçenekleri
   *                 EN: Textarea-specific configuration options
   */
  constructor(
    name: string,
    label: string,
    public override readonly config: TextareaFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Textarea validasyonu için Zod şemasını oluşturur.
   *
   * EN: Creates Zod schema for textarea validation.
   *
   * @returns TR: Yapılandırılmış Zod string şeması
   *          EN: Configured Zod string schema
   */
  schema(): z.ZodType<string> {
    let base = z.string();

    // TR: Minimum karakter kontrolü
    // EN: Minimum character check
    if (this.config.minLength !== undefined) {
      base = base.min(
        this.config.minLength,
        `En az ${this.config.minLength} karakter olmalıdır`
      );
    }

    // TR: Maksimum karakter kontrolü
    // EN: Maximum character check
    if (this.config.maxLength !== undefined) {
      base = base.max(
        this.config.maxLength,
        `En fazla ${this.config.maxLength} karakter olabilir`
      );
    }

    return this.applyRequired(base);
  }

  /**
   * TR: Boş string'leri de handle ederek değeri sunar.
   * Uzun metinleri kısaltarak gösterir.
   *
   * EN: Presents value while handling empty strings.
   * Truncates long texts for display.
   *
   * @param value - TR: Gösterilecek değer
   *                EN: Value to display
   * @returns TR: Kullanıcı dostu gösterim (kısaltılmış)
   *          EN: User-friendly display (truncated)
   */
  override present(value: string | null): string {
    if (value == null || value === '') return '-';

    // TR: 100 karakterden uzunsa kısalt
    // EN: Truncate if longer than 100 characters
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }

    return value;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi string'e dönüştürür.
   *
   * EN: Converts data from external source to string.
   *
   * @param raw - TR: Ham veri
   *              EN: Raw data
   * @returns TR: String değer veya null
   *          EN: String value or null
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null) return null;

    if (typeof raw === 'string') {
      return this.schema().safeParse(raw).success ? raw : null;
    }

    // TR: Diğer tipler string'e çevrilir
    // EN: Other types are converted to string
    const str = String(raw);
    return this.schema().safeParse(str).success ? str : null;
  }

  // ===========================================================================
  // TR: Yardımcı Metodlar
  // EN: Helper Methods
  // ===========================================================================

  /**
   * TR: Satır sayısını döndürür.
   *
   * EN: Returns row count.
   *
   * @returns TR: Satır sayısı (varsayılan: 3)
   *          EN: Row count (default: 3)
   */
  getRows(): number {
    return this.config.rows ?? 3;
  }

  /**
   * TR: Kalan karakter sayısını hesaplar.
   *
   * EN: Calculates remaining character count.
   *
   * @param currentLength - TR: Mevcut karakter sayısı
   *                        EN: Current character count
   * @returns TR: Kalan karakter veya null (limit yoksa)
   *          EN: Remaining characters or null (if no limit)
   */
  getRemainingCharacters(currentLength: number): number | null {
    if (this.config.maxLength === undefined) return null;
    return this.config.maxLength - currentLength;
  }
}
