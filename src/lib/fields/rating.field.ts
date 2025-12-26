import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

export interface RatingFieldConfig extends FieldConfig {
    /**
     * TR: Maksimum yıldız sayısı.
     * EN: Maximum star count.
     * @default 5
     */
    max?: number;

    /**
     * TR: Yarım yıldız izin ver.
     * EN: Allow half stars.
     * @default false
     */
    allowHalf?: boolean;

    /**
     * TR: Sadece okunur.
     * EN: Read only.
     * @default false
     */
    readOnly?: boolean;

    /**
     * TR: Yıldız boyutu (px).
     * EN: Star size (px).
     * @default 24
     */
    size?: number;

    /**
     * TR: Aktif renk.
     * EN: Active color.
     * @default '#fbbf24' (amber)
     */
    activeColor?: string;

    /**
     * TR: Pasif renk.
     * EN: Inactive color.
     * @default '#d1d5db' (gray)
     */
    inactiveColor?: string;
}

export class RatingField extends BaseField<number> {
    readonly type = 'rating';

    constructor(
        name: string,
        label: string,
        public override readonly config: RatingFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<number> {
        const max = this.config.max ?? 5;

        let base = z.number({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        base = base.min(0, {
            message: t('rating.minValue', { min: 0 }),
        });
        base = base.max(max, {
            message: t('rating.maxValue', { max }),
        });

        // Yarım yıldız kontrolü
        if (!this.config.allowHalf) {
            base = base.int(t('rating.mustBeInteger'));
        } else {
            base = base.refine(
                (val) => Number.isInteger(val * 2),
                { message: t('rating.mustBeHalfOrInteger') }
            ) as any;
        }

        return this.applyRequired(base);
    }

    override present(value: number | null): string {
        if (value == null) return '-';

        const max = this.config.max ?? 5;
        const stars = '★'.repeat(Math.floor(value)) + '☆'.repeat(max - Math.ceil(value));
        return `${value}/${max} ${stars}`;
    }

    /**
     * TR: Yıldız sayısını döner.
     * EN: Returns star count.
     */
    getMaxStars(): number {
        return this.config.max ?? 5;
    }
}
