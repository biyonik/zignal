import { z } from 'zod';
import { BaseField } from './base.field';
import {FieldConfig, t} from '../core';

export interface TagsFieldConfig extends FieldConfig {
    /**
     * TR: Minimum tag sayısı.
     * EN: Minimum tag count.
     */
    minTags?: number;

    /**
     * TR: Maksimum tag sayısı.
     * EN: Maximum tag count.
     */
    maxTags?: number;

    /**
     * TR: Tag için minimum karakter.
     * EN: Minimum characters per tag.
     * @default 1
     */
    minTagLength?: number;

    /**
     * TR: Tag için maksimum karakter.
     * EN: Maximum characters per tag.
     * @default 50
     */
    maxTagLength?: number;

    /**
     * TR: Önerilen tag'ler.
     * EN: Suggested tags.
     */
    suggestions?: string[];

    /**
     * TR: Sadece önerilerden seçilebilsin.
     * EN: Only allow from suggestions.
     * @default false
     */
    restrictToSuggestions?: boolean;

    /**
     * TR: Ayırıcı karakterler (Enter her zaman çalışır).
     * EN: Separator characters (Enter always works).
     * @default [',', ';']
     */
    separators?: string[];

    /**
     * TR: Duplicate tag'lere izin ver.
     * EN: Allow duplicate tags.
     * @default false
     */
    allowDuplicates?: boolean;

    /**
     * TR: Otomatik küçük harf.
     * EN: Auto lowercase.
     * @default false
     */
    lowercase?: boolean;
}

export class TagsField extends BaseField<string[]> {
    readonly type = 'tags';

    constructor(
        name: string,
        label: string,
        public override readonly config: TagsFieldConfig = {}
    ) {
        super(name, label, config);
    }

    schema(): z.ZodType<string[]> {
        const minTagLen = this.config.minTagLength ?? 1;
        const maxTagLen = this.config.maxTagLength ?? 50;

        let tagSchema = z.string()
            .min(minTagLen, {
                message: t('tags.minLength', { minTagLength: this.config.maxTagLength! }),
            })
            .max(maxTagLen, {
                message: t('tags.maxLength', { maxTagLength: this.config.maxTagLength! }),
            });

        // Önerilerle sınırla
        if (this.config.restrictToSuggestions && this.config.suggestions?.length) {
            tagSchema = tagSchema.refine(
                (tag) => this.config.suggestions!.includes(tag),
                { message: t('tags.restrictToSuggestions') }
            ) as any;
        }

        let arraySchema = z.array(tagSchema);

        if (this.config.minTags !== undefined) {
            arraySchema = arraySchema.min(this.config.minTags, {
                message: t('tags.minTags', { minTags: this.config.minTagLength! }),
            });
        }

        if (this.config.maxTags !== undefined) {
            arraySchema = arraySchema.max(this.config.maxTags, {
                message: t('tags.maxTags', { maxTags: this.config.maxTagLength! }),
            });
        }

        // Duplicate kontrolü
        if (!this.config.allowDuplicates) {
            arraySchema = arraySchema.refine(
                (tags) => new Set(tags).size === tags.length,
                { message: t('tags.duplicate') }
            ) as any;
        }

        return this.applyRequired(arraySchema) as z.ZodType<string[]>;
    }

    override present(value: string[] | null): string {
        if (!value || value.length === 0) return '-';
        return value.join(', ');
    }

    override toExport(value: string[] | null): string[] | null {
        return value;
    }

    override fromImport(raw: unknown): string[] | null {
        if (raw == null) return null;

        // Zaten array ise
        if (Array.isArray(raw)) {
            return raw.filter((item) => typeof item === 'string');
        }

        // String ise ayır
        if (typeof raw === 'string') {
            const separators = this.config.separators ?? [',', ';'];
            const escapedSeparators = separators.map(s =>
                s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            const regex = new RegExp(`[${escapedSeparators.join('')}]`);
            return raw
                .split(regex)
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
        }

        return null;
    }

    /**
     * TR: Tag'i normalize eder.
     * EN: Normalizes tag.
     */
    normalizeTag(tag: string): string {
        let normalized = tag.trim();
        if (this.config.lowercase) {
            normalized = normalized.toLowerCase();
        }
        return normalized;
    }

    /**
     * TR: Önerileri döner.
     * EN: Returns suggestions.
     */
    getSuggestions(): string[] {
        return this.config.suggestions ?? [];
    }
}
