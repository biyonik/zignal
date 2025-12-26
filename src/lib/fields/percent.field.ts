import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

export interface PercentFieldConfig extends FieldConfig {
    /**
     * TR: Minimum yüzde.
     * EN: Minimum percentage.
     * @default 0
     */
    min?: number;

    /**
     * TR: Maksimum yüzde.
     * EN: Maximum percentage.
     * @default 100
     */
    max?: number;

    /**
     * TR: Ondalık basamak sayısı.
     * EN: Decimal places.
     * @default 0
     */
    decimals?: number;

    /**
     * TR: Slider olarak göster.
     * EN: Show as slider.
     * @default false
     */
    showSlider?: boolean;

    /**
     * TR: Step değeri.
     * EN: Step value.
     * @default 1
     */
    step?: number;
}

export class PercentField extends BaseField<number> {
    readonly type = 'percent';

    constructor(
        name: string,
        label: string,
        public override readonly config: PercentFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<number> {
        const min = this.config.min ?? 0;
        const max = this.config.max ?? 100;

        let base = z.number({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        base = base.min(min, `Minimum %${min} olmalıdır`);
        base = base.max(max, `Maksimum %${max} olabilir`);

        return this.applyRequired(base);
    }

    override present(value: number | null): string {
        if (value == null) return '-';

        const decimals = this.config.decimals ?? 0;
        return `%${value.toFixed(decimals)}`;
    }

    override fromImport(raw: unknown): number | null {
        if (raw == null) return null;

        if (typeof raw === 'number') {
            return raw;
        }

        if (typeof raw === 'string') {
            // "%50" veya "50%" formatı
            const normalized = raw.replace('%', '').trim();
            const num = parseFloat(normalized);
            return isNaN(num) ? null : num;
        }

        return null;
    }
}
