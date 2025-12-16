import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig } from '../core';

/**
 * @fileoverview
 * TR: E-posta girişi için kullanılan EmailField sınıfı.
 * Otomatik e-posta formatı validasyonu ve opsiyonel domain kontrolü sağlar.
 *
 * EN: EmailField class used for email input.
 * Provides automatic email format validation and optional domain control.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: EmailField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for EmailField.
 */
export interface EmailFieldConfig extends FieldConfig {
  /**
   * TR: İzin verilen domain listesi. Belirtilirse sadece bu domainler kabul edilir.
   * EN: List of allowed domains. If specified, only these domains are accepted.
   *
   * @example ['gmail.com', 'outlook.com', 'company.com']
   */
  allowedDomains?: string[];

  /**
   * TR: Engellenen domain listesi.
   * EN: List of blocked domains.
   *
   * @example ['tempmail.com', 'throwaway.com']
   */
  blockedDomains?: string[];

  /**
   * TR: Tek kullanımlık (disposable) e-posta adreslerini engelle.
   * EN: Block disposable email addresses.
   * @default false
   */
  blockDisposable?: boolean;

  /**
   * TR: E-postayı küçük harfe dönüştür.
   * EN: Convert email to lowercase.
   * @default true
   */
  lowercase?: boolean;
}

/**
 * TR: Yaygın tek kullanımlık e-posta domainleri.
 * EN: Common disposable email domains.
 */
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'getnada.com',
];

/**
 * TR: E-posta girişi için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - E-posta format validasyonu (otomatik)
 * - `allowedDomains`: Sadece belirli domainleri kabul et
 * - `blockedDomains`: Belirli domainleri engelle
 * - `blockDisposable`: Tek kullanımlık e-postaları engelle
 *
 * EN: Zignal field implementation for email input.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - Email format validation (automatic)
 * - `allowedDomains`: Accept only specific domains
 * - `blockedDomains`: Block specific domains
 * - `blockDisposable`: Block disposable emails
 *
 * @example
 * ```typescript
 * // Basit e-posta alanı
 * const email = new EmailField('email', 'E-posta', {
 *   required: true
 * });
 *
 * // Kurumsal e-posta zorunlu
 * const workEmail = new EmailField('workEmail', 'İş E-postası', {
 *   required: true,
 *   allowedDomains: ['company.com', 'company.org'],
 *   blockDisposable: true
 * });
 * ```
 */
export class EmailField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override readonly config: EmailFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: E-posta validasyonu için Zod şemasını oluşturur.
   * EN: Creates Zod schema for email validation.
   */
  schema(): z.ZodType<string> {
    let base: z.ZodType<string> = z.string().email('Geçerli bir e-posta adresi giriniz');

    // TR: Domain kontrolü
    // EN: Domain check
    if (this.config.allowedDomains?.length) {
      const allowed = this.config.allowedDomains;
      base = base.refine(
        (email) => {
          const domain = this.extractDomain(email);
          return domain ? allowed.includes(domain.toLowerCase()) : false;
        },
        { message: `İzin verilen domainler: ${this.config.allowedDomains.join(', ')}` }
      );
    }

    if (this.config.blockedDomains?.length) {
      const blocked = this.config.blockedDomains;
      base = base.refine(
        (email) => {
          const domain = this.extractDomain(email);
          return domain ? !blocked.includes(domain.toLowerCase()) : true;
        },
        { message: 'Bu e-posta domaini kabul edilmiyor' }
      );
    }

    if (this.config.blockDisposable) {
      base = base.refine(
        (email) => {
          const domain = this.extractDomain(email);
          return domain ? !DISPOSABLE_DOMAINS.includes(domain.toLowerCase()) : true;
        },
        { message: 'Tek kullanımlık e-posta adresleri kabul edilmiyor' }
      );
    }

    return this.applyRequired(base);
  }

  /**
   * TR: E-posta adresinden domain'i çıkarır.
   * EN: Extracts domain from email address.
   */
  private extractDomain(email: string): string | null {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
  }

  /**
   * TR: E-postayı normalize eder (küçük harf).
   * EN: Normalizes email (lowercase).
   */
  normalize(value: string | null): string | null {
    if (!value) return null;
    return this.config.lowercase !== false ? value.toLowerCase().trim() : value.trim();
  }

  /**
   * TR: Dışa aktarım için e-postayı normalize eder.
   * EN: Normalizes email for export.
   */
  override toExport(value: string | null): string | null {
    return this.normalize(value);
  }

  /**
   * TR: İçe aktarımda e-postayı normalize eder.
   * EN: Normalizes email on import.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null) return null;
    if (typeof raw !== 'string') return null;

    const normalized = this.normalize(raw);
    if (!normalized) return null;

    return this.schema().safeParse(normalized).success ? normalized : null;
  }
}
