import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig } from '../core';

/**
 * @fileoverview
 * TR: Telefon numarası girişi için kullanılan PhoneField sınıfı.
 * Türkiye ve uluslararası telefon formatlarını destekler.
 *
 * EN: PhoneField class used for phone number input.
 * Supports Turkish and international phone formats.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Desteklenen ülke kodları.
 * EN: Supported country codes.
 */
export type PhoneCountry = 'TR' | 'US' | 'DE' | 'GB' | 'FR' | 'INTL';

/**
 * TR: PhoneField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for PhoneField.
 */
export interface PhoneFieldConfig extends FieldConfig {
  /**
   * TR: Ülke kodu. Varsayılan: TR (Türkiye).
   * EN: Country code. Default: TR (Turkey).
   * @default 'TR'
   */
  country?: PhoneCountry;

  /**
   * TR: Ülke kodu prefix'i gösterilsin mi? (+90)
   * EN: Should country code prefix be shown? (+90)
   * @default true
   */
  showCountryCode?: boolean;

  /**
   * TR: Telefon numarasını normalize et (sadece rakamlar).
   * EN: Normalize phone number (digits only).
   * @default true
   */
  normalize?: boolean;

  /**
   * TR: Mask formatı gösterilsin mi?
   * EN: Should mask format be shown?
   * @default false
   */
  showMask?: boolean;
}

/**
 * TR: Ülke bazlı telefon formatları ve regex'leri.
 * EN: Country-based phone formats and regex patterns.
 */
const PHONE_PATTERNS: Record<PhoneCountry, {
  regex: RegExp;
  mask: string;
  prefix: string;
  example: string;
  normalizeRegex: RegExp;
}> = {
  TR: {
    regex: /^(\+90|0)?[5][0-9]{9}$/,
    mask: '(5XX) XXX XX XX',
    prefix: '+90',
    example: '532 123 45 67',
    normalizeRegex: /^(?:\+90|90|0)?([5][0-9]{9})$/,
  },
  US: {
    regex: /^(\+1)?[2-9]\d{2}[2-9]\d{6}$/,
    mask: '(XXX) XXX-XXXX',
    prefix: '+1',
    example: '(555) 123-4567',
    normalizeRegex: /^(?:\+1|1)?([2-9]\d{2}[2-9]\d{6})$/,
  },
  DE: {
    regex: /^(\+49|0)?[1-9]\d{6,14}$/,
    mask: 'XXXX XXXXXXX',
    prefix: '+49',
    example: '151 12345678',
    normalizeRegex: /^(?:\+49|49|0)?([1-9]\d{6,14})$/,
  },
  GB: {
    regex: /^(\+44|0)?[7]\d{9}$/,
    mask: 'XXXX XXX XXXX',
    prefix: '+44',
    example: '7911 123456',
    normalizeRegex: /^(?:\+44|44|0)?([7]\d{9})$/,
  },
  FR: {
    regex: /^(\+33|0)?[67]\d{8}$/,
    mask: 'XX XX XX XX XX',
    prefix: '+33',
    example: '06 12 34 56 78',
    normalizeRegex: /^(?:\+33|33|0)?([67]\d{8})$/,
  },
  INTL: {
    regex: /^\+?[1-9]\d{6,14}$/,
    mask: '+X XXX XXX XXXX',
    prefix: '+',
    example: '+90 532 123 45 67',
    normalizeRegex: /^\+?([1-9]\d{6,14})$/,
  },
};

/**
 * TR: Telefon numarası girişi için Zignal alan implementasyonu.
 *
 * Desteklenen ülkeler:
 * - TR: Türkiye (+90 5XX XXX XX XX)
 * - US: Amerika (+1 XXX XXX XXXX)
 * - DE: Almanya (+49 XXX XXXXXXX)
 * - GB: İngiltere (+44 7XXX XXX XXX)
 * - FR: Fransa (+33 X XX XX XX XX)
 * - INTL: Uluslararası (herhangi bir format)
 *
 * EN: Zignal field implementation for phone number input.
 *
 * Supported countries:
 * - TR: Turkey (+90 5XX XXX XX XX)
 * - US: United States (+1 XXX XXX XXXX)
 * - DE: Germany (+49 XXX XXXXXXX)
 * - GB: United Kingdom (+44 7XXX XXX XXX)
 * - FR: France (+33 X XX XX XX XX)
 * - INTL: International (any format)
 *
 * @example
 * ```typescript
 * // Türk telefon numarası
 * const phone = new PhoneField('phone', 'Telefon', {
 *   required: true,
 *   country: 'TR'
 * });
 *
 * // Amerikan telefon numarası
 * const usPhone = new PhoneField('phone', 'Phone', {
 *   required: true,
 *   country: 'US'
 * });
 *
 * // Uluslararası format
 * const intlPhone = new PhoneField('phone', 'Phone', {
 *   required: true,
 *   country: 'INTL'
 * });
 * ```
 */
export class PhoneField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override readonly config: PhoneFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Kullanılan ülke kodunu döndürür.
   * EN: Returns the country code being used.
   */
  get country(): PhoneCountry {
    return this.config.country ?? 'TR';
  }

  /**
   * TR: Ülke pattern bilgisini döndürür.
   * EN: Returns country pattern info.
   */
  get pattern() {
    return PHONE_PATTERNS[this.country];
  }

  /**
   * TR: Telefon validasyonu için Zod şemasını oluşturur.
   * EN: Creates Zod schema for phone validation.
   */
  schema(): z.ZodType<string> {
    const pattern = this.pattern;
    const countryName = this.getCountryName();

    const base = z.string()
      .transform((val) => val.replace(/[\s\-\(\)\.]/g, '')) // Formatlamayı kaldır
      .refine(
        (val) => pattern.regex.test(val),
        { message: `Geçerli bir ${countryName} telefon numarası giriniz (Örn: ${pattern.example})` }
      );

    return this.applyRequired(base);
  }

  /**
   * TR: Ülke adını döndürür.
   * EN: Returns country name.
   */
  private getCountryName(): string {
    const names: Record<PhoneCountry, string> = {
      TR: 'Türkiye',
      US: 'Amerika',
      DE: 'Almanya',
      GB: 'İngiltere',
      FR: 'Fransa',
      INTL: 'uluslararası',
    };
    return names[this.country];
  }

  /**
   * TR: Telefon numarasını normalize eder (sadece rakamlar).
   * EN: Normalizes phone number (digits only).
   */
  normalize(value: string | null): string | null {
    if (!value) return null;

    // TR: Tüm format karakterlerini kaldır
    // EN: Remove all format characters
    const cleaned = value.replace(/[\s\-\(\)\.]/g, '');

    // TR: Ülkeye göre normalize et
    // EN: Normalize according to country
    const match = cleaned.match(this.pattern.normalizeRegex);
    if (match && match[1]) {
      return match[1];
    }

    return cleaned.replace(/\D/g, '');
  }

  /**
   * TR: Telefon numarasını formatlı gösterir.
   * EN: Displays phone number formatted.
   */
  override present(value: string | null): string {
    if (!value) return '-';

    const normalized = this.normalize(value);
    if (!normalized) return value;

    return this.formatPhone(normalized);
  }

  /**
   * TR: Telefon numarasını ülke formatına göre formatlar.
   * EN: Formats phone number according to country format.
   */
  formatPhone(digits: string): string {
    const pattern = this.pattern;
    const showPrefix = this.config.showCountryCode !== false;

    switch (this.country) {
      case 'TR':
        if (digits.length === 10) {
          const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
          return showPrefix ? `${pattern.prefix} ${formatted}` : formatted;
        }
        break;
      case 'US':
        if (digits.length === 10) {
          const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
          return showPrefix ? `${pattern.prefix} ${formatted}` : formatted;
        }
        break;
      case 'DE':
        if (digits.length >= 10) {
          const formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
          return showPrefix ? `${pattern.prefix} ${formatted}` : formatted;
        }
        break;
      case 'GB':
        if (digits.length === 10) {
          const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
          return showPrefix ? `${pattern.prefix} ${formatted}` : formatted;
        }
        break;
      case 'FR':
        if (digits.length === 9) {
          const formatted = `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
          return showPrefix ? `${pattern.prefix} ${formatted}` : formatted;
        }
        break;
    }

    // TR: Format uygulanamadıysa prefix ile döndür
    // EN: Return with prefix if format couldn't be applied
    return showPrefix ? `${pattern.prefix} ${digits}` : digits;
  }

  /**
   * TR: Dışa aktarım için normalize edilmiş değer.
   * EN: Normalized value for export.
   */
  override toExport(value: string | null): string | null {
    if (!value) return null;

    const normalized = this.normalize(value);
    if (!normalized) return value;

    // TR: E.164 formatında döndür
    // EN: Return in E.164 format
    const prefix = this.pattern.prefix.replace('+', '');
    return `+${prefix}${normalized}`;
  }

  /**
   * TR: İçe aktarımda telefonu normalize eder.
   * EN: Normalizes phone on import.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null) return null;
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;

    const str = String(raw);
    const cleaned = str.replace(/[\s\-\(\)\.]/g, '');

    if (this.pattern.regex.test(cleaned)) {
      return cleaned;
    }

    return null;
  }

  /**
   * TR: Input mask'ını döndürür.
   * EN: Returns input mask.
   */
  getMask(): string {
    return this.pattern.mask;
  }

  /**
   * TR: Örnek telefon numarasını döndürür.
   * EN: Returns example phone number.
   */
  getExample(): string {
    return this.pattern.example;
  }
}
