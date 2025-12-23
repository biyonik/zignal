import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * @fileoverview
 * TR: Şifre girişi için kullanılan PasswordField sınıfı.
 * Güvenlik gereksinimleri (büyük harf, rakam, özel karakter) dahil.
 *
 * EN: PasswordField class used for password input.
 * Includes security requirements (uppercase, number, special character).
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: PasswordField için genişletilmiş yapılandırma seçenekleri.
 * Şifre güvenlik politikalarını tanımlar.
 *
 * EN: Extended configuration options for PasswordField.
 * Defines password security policies.
 */
export interface PasswordFieldConfig extends FieldConfig {
    /**
     * TR: Minimum karakter sayısı.
     * EN: Minimum character count.
     * @default 8
     */
    minLength?: number;

    /**
     * TR: Maksimum karakter sayısı.
     * EN: Maximum character count.
     */
    maxLength?: number;

    /**
     * TR: En az bir büyük harf zorunlu mu?
     * EN: Is at least one uppercase letter required?
     * @default false
     */
    requireUppercase?: boolean;

    /**
     * TR: En az bir küçük harf zorunlu mu?
     * EN: Is at least one lowercase letter required?
     * @default false
     */
    requireLowercase?: boolean;

    /**
     * TR: En az bir rakam zorunlu mu?
     * EN: Is at least one number required?
     * @default false
     */
    requireNumber?: boolean;

    /**
     * TR: En az bir özel karakter zorunlu mu?
     * EN: Is at least one special character required?
     * @default false
     */
    requireSpecial?: boolean;

    /**
     * TR: Özel karakter seti. Varsayılan: !@#$%^&*()_+-=[]{}|;:,.<>?
     * EN: Special character set. Default: !@#$%^&*()_+-=[]{}|;:,.<>?
     */
    specialChars?: string;

    /**
     * TR: Şifre gücü göstergesi aktif mi?
     * EN: Is password strength indicator active?
     * @default true
     */
    showStrength?: boolean;
}

/**
 * TR: Şifre gücü seviyeleri.
 * EN: Password strength levels.
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * TR: Şifre girişi için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - `minLength`: Minimum karakter sayısı (varsayılan: 8)
 * - `maxLength`: Maksimum karakter sayısı
 * - `requireUppercase`: En az bir büyük harf
 * - `requireLowercase`: En az bir küçük harf
 * - `requireNumber`: En az bir rakam
 * - `requireSpecial`: En az bir özel karakter
 *
 * EN: Zignal field implementation for password input.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - `minLength`: Minimum character count (default: 8)
 * - `maxLength`: Maximum character count
 * - `requireUppercase`: At least one uppercase letter
 * - `requireLowercase`: At least one lowercase letter
 * - `requireNumber`: At least one number
 * - `requireSpecial`: At least one special character
 *
 * @example
 * ```typescript
 * // Güçlü şifre gereksinimleri
 * const password = new PasswordField('password', 'Şifre', {
 *   required: true,
 *   minLength: 8,
 *   requireUppercase: true,
 *   requireNumber: true,
 *   requireSpecial: true
 * });
 *
 * // Basit şifre
 * const simplePassword = new PasswordField('pin', 'PIN', {
 *   required: true,
 *   minLength: 4,
 *   maxLength: 6
 * });
 * ```
 */
export class PasswordField extends BaseField<string> {
    readonly type = 'password';
    private readonly DEFAULT_MIN_LENGTH = 8;
    private readonly DEFAULT_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    constructor(
        name: string,
        label: string,
        public override readonly config: PasswordFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Şifre validasyonu için Zod şemasını oluşturur.
     * EN: Creates Zod schema for password validation.
     */
    schema(): z.ZodType<string> {
        const minLen = this.config.minLength ?? this.DEFAULT_MIN_LENGTH;
        const specialChars = this.config.specialChars ?? this.DEFAULT_SPECIAL_CHARS;
        const escapedSpecialChars = specialChars.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');

        let base = z.string().min(minLen, t('password.min', { min: minLen }));

        if (this.config.required) {
            base = base.min(1, t('required'));
        }

        if (this.config.maxLength !== undefined) {
            base = base.max(this.config.maxLength, t('password.max', { max: this.config.maxLength }));
        }

        if (this.config.requireUppercase) {
            base = base.regex(/[A-Z]/, t('password.uppercase'));
        }

        if (this.config.requireLowercase) {
            base = base.regex(/[a-z]/, t('password.lowercase'));
        }

        if (this.config.requireNumber) {
            base = base.regex(/[0-9]/, t('password.number'));
        }

        if (this.config.requireSpecial) {
            base = base.regex(
                new RegExp(`[${escapedSpecialChars}]`),
                t('password.special')
            );
        }

        const processed = z.preprocess(
            (val) => val === null ? '' : val,
            base
        );

        return this.applyRequired(processed);
    }

    /**
     * TR: Şifreyi maskeli olarak gösterir.
     * EN: Displays password as masked.
     */
    override present(value: string | null): string {
        if (value == null || value === '') return '-';
        return '••••••••';
    }

    /**
     * TR: Şifre gücünü hesaplar.
     * EN: Calculates password strength.
     *
     * @param value - TR: Şifre değeri / EN: Password value
     * @returns TR: Şifre gücü seviyesi / EN: Password strength level
     */
    calculateStrength(value: string | null): PasswordStrength {
        if (!value || value.length === 0) return 'weak';

        let score = 0;

        // Uzunluk puanı
        if (value.length >= 8) score++;
        if (value.length >= 12) score++;
        if (value.length >= 16) score++;

        // Karakter çeşitliliği
        if (/[a-z]/.test(value)) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^a-zA-Z0-9]/.test(value)) score++;

        if (score <= 2) return 'weak';
        if (score <= 4) return 'fair';
        if (score <= 6) return 'good';
        return 'strong';
    }

    /**
     * TR: Şifre gücü yüzdesini döndürür (0-100).
     * EN: Returns password strength percentage (0-100).
     */
    getStrengthPercentage(value: string | null): number {
        const strength = this.calculateStrength(value);
        const map: Record<PasswordStrength, number> = {
            weak: 25,
            fair: 50,
            good: 75,
            strong: 100,
        };
        return map[strength];
    }
}