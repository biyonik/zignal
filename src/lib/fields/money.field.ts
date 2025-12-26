import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * TR: Para birimi değeri.
 * EN: Money value with currency.
 */
export interface MoneyValue {
    amount: number;
    currency: string;
}

export interface MoneyFieldConfig extends FieldConfig {
    /**
     * TR: Varsayılan para birimi.
     * EN: Default currency.
     * @default 'TRY'
     */
    defaultCurrency?: string;

    /**
     * TR: Desteklenen para birimleri.
     * EN: Supported currencies.
     * @default ['TRY', 'USD', 'EUR']
     */
    currencies?: string[];

    /**
     * TR: Para birimi seçimi gösterilsin mi?
     * EN: Show currency selector?
     * @default true
     */
    showCurrencySelector?: boolean;

    /**
     * TR: Minimum miktar.
     * EN: Minimum amount.
     */
    min?: number;

    /**
     * TR: Maksimum miktar.
     * EN: Maximum amount.
     */
    max?: number;

    /**
     * TR: Ondalık basamak sayısı.
     * EN: Decimal places.
     * @default 2
     */
    decimals?: number;

    /**
     * TR: Negatif değere izin ver.
     * EN: Allow negative values.
     * @default false
     */
    allowNegative?: boolean;
}

export class MoneyField extends BaseField<MoneyValue> {
    readonly type = 'money';

    static readonly CURRENCY_SYMBOLS: Record<string, string> = {
        TRY: '₺',
        USD: '$',
        EUR: '€',
        GBP: '£',
    };

    constructor(
        name: string,
        label: string,
        public override readonly config: MoneyFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<MoneyValue> {
        const currencies = this.config.currencies ?? ['TRY', 'USD', 'EUR'];

        let amountSchema = z.number({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        if (!this.config.allowNegative) {
            amountSchema = amountSchema.min(0, 'Miktar negatif olamaz');
        }

        if (this.config.min !== undefined) {
            amountSchema = amountSchema.min(this.config.min, t('number.min', { min: this.config.min }));
        }

        if (this.config.max !== undefined) {
            amountSchema = amountSchema.max(this.config.max, t('number.max', { max: this.config.max }));
        }

        const moneySchema = z.object({
            amount: amountSchema,
            currency: z.enum(currencies as [string, ...string[]], {
                errorMap: () => ({ message: 'Geçersiz para birimi' }),
            }),
        });

        return this.applyRequired(moneySchema) as z.ZodType<MoneyValue>;
    }

    override present(value: MoneyValue | null): string {
        if (!value) return '-';

        const symbol = MoneyField.CURRENCY_SYMBOLS[value.currency] ?? value.currency;
        const decimals = this.config.decimals ?? 2;

        const formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value.amount);

        return `${formatted} ${symbol}`;
    }

    override toExport(value: MoneyValue | null): unknown {
        if (!value) return null;
        return {
            amount: value.amount,
            currency: value.currency,
        };
    }

    override fromImport(raw: unknown): MoneyValue | null {
        if (raw == null) return null;

        // Number olarak geldiyse varsayılan para birimi ile
        if (typeof raw === 'number') {
            return {
                amount: raw,
                currency: this.config.defaultCurrency ?? 'TRY',
            };
        }

        // Object olarak geldiyse
        if (typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            if (typeof obj.amount === 'number' && typeof obj.currency === 'string') {
                return {
                    amount: obj.amount,
                    currency: obj.currency,
                };
            }
        }

        return null;
    }

    /**
     * TR: Para birimi sembolünü döner.
     * EN: Returns currency symbol.
     */
    getCurrencySymbol(currency: string): string {
        return MoneyField.CURRENCY_SYMBOLS[currency] ?? currency;
    }

    /**
     * TR: Desteklenen para birimlerini döner.
     * EN: Returns supported currencies.
     */
    getCurrencies(): string[] {
        return this.config.currencies ?? ['TRY', 'USD', 'EUR'];
    }
}
