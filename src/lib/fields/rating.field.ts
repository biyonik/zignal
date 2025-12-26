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
        const step = this.config.allowHalf ? 0.5 : 1;

        let base = z.number({
            invalid_type_error: t('invalid'),
            required_error: t('required'),
        });

        base = base.min(0, 'Rating 0 veya üzeri olmalıdır');
        base = base.max(max, `Rating en fazla ${max} olabilir`);

        // Yarım yıldız kontrolü
        if (!this.config.allowHalf) {
            base = base.int('Tam sayı olmalıdır');
        } else {
            base = base.refine(
                (val) => val % 0.5 === 0,
                { message: 'Rating 0.5\'in katı olmalıdır' }
            );
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
