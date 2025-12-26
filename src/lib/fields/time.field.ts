import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

/**
 * TR: Saat değeri (HH:mm formatında).
 * EN: Time value (in HH:mm format).
 */
export interface TimeValue {
    hours: number;
    minutes: number;
}

export interface TimeFieldConfig extends FieldConfig {
    /**
     * TR: Minimum saat.
     * EN: Minimum time.
     */
    min?: TimeValue;

    /**
     * TR: Maksimum saat.
     * EN: Maximum time.
     */
    max?: TimeValue;

    /**
     * TR: Dakika step değeri.
     * EN: Minute step value.
     * @default 1
     */
    minuteStep?: number;

    /**
     * TR: 24 saat formatı.
     * EN: 24-hour format.
     * @default true
     */
    format24h?: boolean;

    /**
     * TR: Saniye göster.
     * EN: Show seconds.
     * @default false
     */
    showSeconds?: boolean;
}

export class TimeField extends BaseField<TimeValue> {
    readonly type = 'time';

    constructor(
        name: string,
        label: string,
        public override readonly config: TimeFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<TimeValue> {
        const timeSchema = z.object({
            hours: z.number().min(0).max(23),
            minutes: z.number().min(0).max(59),
        });

        let refined = timeSchema;

        // Min kontrolü
        if (this.config.min) {
            const minMinutes = this.toMinutes(this.config.min);
            refined = refined.refine(
                (val) => this.toMinutes(val) >= minMinutes,
                {message: `Saat ${this.formatTime(this.config.min)} veya sonrası olmalıdır`}
            ) as unknown as typeof refined;
        }

        // Max kontrolü
        if (this.config.max) {
            const maxMinutes = this.toMinutes(this.config.max);
            refined = refined.refine(
                (val) => this.toMinutes(val) <= maxMinutes,
                {message: `Saat ${this.formatTime(this.config.max)} veya öncesi olmalıdır`}
            ) as unknown as typeof refined;
        }

        return this.applyRequired(refined) as z.ZodType<TimeValue>;
    }

    private toMinutes(time: TimeValue): number {
        return time.hours * 60 + time.minutes;
    }

    private formatTime(time: TimeValue): string {
        const h = time.hours.toString().padStart(2, '0');
        const m = time.minutes.toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    override present(value: TimeValue | null): string {
        if (!value) return '-';
        return this.formatTime(value);
    }

    override toExport(value: TimeValue | null): string | null {
        if (!value) return null;
        return this.formatTime(value);
    }

    override fromImport(raw: unknown): TimeValue | null {
        if (raw == null) return null;

        // "14:30" formatı
        if (typeof raw === 'string') {
            const match = raw.match(/^(\d{1,2}):(\d{2})$/);
            if (match) {
                const hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2], 10);
                if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    return { hours, minutes };
                }
            }
        }

        // Object formatı
        if (typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            if (typeof obj.hours === 'number' && typeof obj.minutes === 'number') {
                return { hours: obj.hours, minutes: obj.minutes };
            }
        }

        return null;
    }

    /**
     * TR: TimeValue'dan Date oluşturur.
     * EN: Creates Date from TimeValue.
     */
    toDate(time: TimeValue, baseDate = new Date()): Date {
        const date = new Date(baseDate);
        date.setHours(time.hours, time.minutes, 0, 0);
        return date;
    }

    /**
     * TR: Date'den TimeValue oluşturur.
     * EN: Creates TimeValue from Date.
     */
    fromDate(date: Date): TimeValue {
        return {
            hours: date.getHours(),
            minutes: date.getMinutes(),
        };
    }
}
