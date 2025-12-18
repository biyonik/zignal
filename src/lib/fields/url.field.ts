import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: URL girişi için kullanılan UrlField sınıfı.
 * Protokol kontrolü ve domain kısıtlamaları sağlar.
 *
 * EN: UrlField class used for URL input.
 * Provides protocol checking and domain restrictions.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: UrlField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for UrlField.
 */
export interface UrlFieldConfig extends FieldConfig {
    /**
     * TR: İzin verilen protokoller.
     * EN: Allowed protocols.
     * @default ['http', 'https']
     */
    allowedProtocols?: string[];

    /**
     * TR: HTTPS zorunlu mu?
     * EN: Is HTTPS required?
     * @default false
     */
    requireHttps?: boolean;

    /**
     * TR: İzin verilen domainler. Belirtilirse sadece bu domainler kabul edilir.
     * EN: Allowed domains. If specified, only these domains are accepted.
     */
    allowedDomains?: string[];

    /**
     * TR: Engellenen domainler.
     * EN: Blocked domains.
     */
    blockedDomains?: string[];

    /**
     * TR: Path zorunlu mu? (örn: example.com/path)
     * EN: Is path required? (e.g., example.com/path)
     * @default false
     */
    requirePath?: boolean;
}

/**
 * TR: URL girişi için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - URL format validasyonu (otomatik)
 * - `allowedProtocols`: İzin verilen protokoller
 * - `requireHttps`: HTTPS zorunluluğu
 * - `allowedDomains`: Sadece belirli domainleri kabul et
 * - `blockedDomains`: Belirli domainleri engelle
 * - `requirePath`: Path zorunluluğu
 *
 * EN: Zignal field implementation for URL input.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - URL format validation (automatic)
 * - `allowedProtocols`: Allowed protocols
 * - `requireHttps`: HTTPS requirement
 * - `allowedDomains`: Accept only specific domains
 * - `blockedDomains`: Block specific domains
 * - `requirePath`: Path requirement
 *
 * @example
 * ```typescript
 * // Basit URL alanı
 * const website = new UrlField('website', 'Web Sitesi', {
 *   required: true
 * });
 *
 * // Güvenli URL zorunlu
 * const secureUrl = new UrlField('apiEndpoint', 'API Endpoint', {
 *   required: true,
 *   requireHttps: true
 * });
 *
 * // Sadece belirli domainler
 * const socialUrl = new UrlField('linkedin', 'LinkedIn Profili', {
 *   allowedDomains: ['linkedin.com', 'www.linkedin.com']
 * });
 * ```
 */
export class UrlField extends BaseField<string> {
    readonly type = 'url';
    private readonly DEFAULT_PROTOCOLS = ['http', 'https'];

    constructor(
        name: string,
        label: string,
        public override readonly config: UrlFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: URL validasyonu için Zod şemasını oluşturur.
     * EN: Creates Zod schema for URL validation.
     */
    schema(): z.ZodType<string> {
        let base: z.ZodType<string> = z.string().url(t('string.url'));

        // TR: Protokol kontrolü
        // EN: Protocol check
        const allowedProtocols = this.config.requireHttps
            ? ['https']
            : (this.config.allowedProtocols ?? this.DEFAULT_PROTOCOLS);

        base = base.refine(
            (url) => {
                try {
                    const parsed = new URL(url);
                    const protocol = parsed.protocol.replace(':', '');
                    return allowedProtocols.includes(protocol);
                } catch {
                    return false;
                }
            },
            {
                message: this.config.requireHttps
                    ? 'URL HTTPS olmalıdır'
                    : `İzin verilen protokoller: ${allowedProtocols.join(', ')}`
            }
        );

        // TR: Domain kontrolü
        // EN: Domain check
        if (this.config.allowedDomains?.length) {
            const allowed = this.config.allowedDomains.map(d => d.toLowerCase());
            base = base.refine(
                (url) => {
                    const domain = this.extractDomain(url);
                    return domain ? allowed.includes(domain.toLowerCase()) : false;
                },
                { message: `İzin verilen domainler: ${this.config.allowedDomains.join(', ')}` }
            );
        }

        if (this.config.blockedDomains?.length) {
            const blocked = this.config.blockedDomains.map(d => d.toLowerCase());
            base = base.refine(
                (url) => {
                    const domain = this.extractDomain(url);
                    return domain ? !blocked.includes(domain.toLowerCase()) : true;
                },
                { message: 'Bu domain kabul edilmiyor' }
            );
        }

        // TR: Path kontrolü
        // EN: Path check
        if (this.config.requirePath) {
            base = base.refine(
                (url) => {
                    try {
                        const parsed = new URL(url);
                        return parsed.pathname.length > 1; // "/" dışında bir path olmalı
                    } catch {
                        return false;
                    }
                },
                { message: 'URL bir path içermelidir' }
            );
        }

        return this.applyRequired(base);
    }

    /**
     * TR: URL'den domain'i çıkarır.
     * EN: Extracts domain from URL.
     */
    private extractDomain(url: string): string | null {
        try {
            const parsed = new URL(url);
            return parsed.hostname;
        } catch {
            return null;
        }
    }

    /**
     * TR: URL'i normalize eder (trailing slash kaldır).
     * EN: Normalizes URL (remove trailing slash).
     */
    normalize(value: string | null): string | null {
        if (!value) return null;
        let url = value.trim();

        // TR: Trailing slash kaldır (path yoksa)
        // EN: Remove trailing slash (if no path)
        try {
            const parsed = new URL(url);
            if (parsed.pathname === '/') {
                url = url.replace(/\/$/, '');
            }
        } catch {
            // Invalid URL, return as is
        }

        return url;
    }

    /**
     * TR: URL'in kısa gösterimini döndürür.
     * EN: Returns short display of URL.
     */
    override present(value: string | null): string {
        if (!value) return '-';

        try {
            const parsed = new URL(value);
            // TR: Protokol olmadan göster
            // EN: Display without protocol
            return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
        } catch {
            return value;
        }
    }
}