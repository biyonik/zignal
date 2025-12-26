import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

export interface MaskedFieldConfig extends FieldConfig {
    /**
     * TR: Mask pattern.
     * # = rakam, A = harf, * = herhangi
     * EN: Mask pattern.
     * # = digit, A = letter, * = any
     *
     * @example '(###) ###-####' // Telefon
     * @example '##/##/####'     // Tarih
     * @example '#### #### #### ####' // Kredi kartı
     */
    mask: string;

    /**
     * TR: Mask karakterini göster.
     * EN: Show mask character.
     * @default '_'
     */
    maskChar?: string;

    /**
     * TR: Sadece değeri sakla (mask olmadan).
     * EN: Store only value (without mask).
     * @default true
     */
    unmaskValue?: boolean;

    /**
     * TR: Mask'ı her zaman göster.
     * EN: Always show mask.
     * @default false
     */
    alwaysShowMask?: boolean;
}

export class MaskedField extends BaseField<string> {
    readonly type = 'masked';

    constructor(
        name: string,
        label: string,
        public override readonly config: MaskedFieldConfig
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<string> {
        const pattern = this.buildRegexFromMask();

        let base = z.string();

        if (this.config.required) {
            base = base.min(1, t('required'));
        }

        base = base.regex(pattern, 'Geçersiz format');

        return this.applyRequired(base);
    }

    /**
     * TR: Mask'tan regex oluşturur.
     * EN: Builds regex from mask.
     */
    private buildRegexFromMask(): RegExp {
        const mask = this.config.mask;
        let regexStr = '^';

        for (const char of mask) {
            switch (char) {
                case '#':
                    regexStr += '\\d';
                    break;
                case 'A':
                    regexStr += '[a-zA-Z]';
                    break;
                case '*':
                    regexStr += '.';
                    break;
                default:
                    // Literal karakter (escape et)
                    regexStr += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
        }

        regexStr += '$';
        return new RegExp(regexStr);
    }

    /**
     * TR: Değere mask uygular.
     * EN: Applies mask to value.
     */
    applyMask(value: string): string {
        const mask = this.config.mask;
        const maskChar = this.config.maskChar ?? '_';
        let result = '';
        let valueIndex = 0;

        for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
            const maskCharacter = mask[i];

            if (maskCharacter === '#' || maskCharacter === 'A' || maskCharacter === '*') {
                result += value[valueIndex] || maskChar;
                valueIndex++;
            } else {
                result += maskCharacter;
                // Eğer value'daki karakter mask karakteri ile aynıysa atla
                if (value[valueIndex] === maskCharacter) {
                    valueIndex++;
                }
            }
        }

        return result;
    }

    /**
     * TR: Mask'ı kaldırır.
     * EN: Removes mask.
     */
    unmask(value: string): string {
        const mask = this.config.mask;
        let result = '';

        for (let i = 0; i < value.length && i < mask.length; i++) {
            const maskChar = mask[i];
            if (maskChar === '#' || maskChar === 'A' || maskChar === '*') {
                result += value[i];
            }
        }

        return result;
    }

    override present(value: string | null): string {
        if (value == null || value === '') return '-';
        return this.applyMask(value);
    }

    override toExport(value: string | null): string | null {
        if (value == null) return null;
        return this.config.unmaskValue !== false ? this.unmask(value) : value;
    }

    /**
     * TR: Mask pattern'i döner.
     * EN: Returns mask pattern.
     */
    getMask(): string {
        return this.config.mask;
    }

    /**
     * TR: Mask'sız değerin beklenen uzunluğu.
     * EN: Expected length of unmasked value.
     */
    getExpectedLength(): number {
        return this.config.mask.split('').filter((c) => ['#', 'A', '*'].includes(c)).length;
    }
}
