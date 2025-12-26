import { z } from 'zod';
import { BaseField } from './base.field';
import { FieldConfig, t } from '../core';

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
            .min(minTagLen, `Her tag en az ${minTagLen} karakter olmalıdır`)
            .max(maxTagLen, `Her tag en fazla ${maxTagLen} karakter olabilir`);

        // Önerilerle sınırla
        if (this.config.restrictToSuggestions && this.config.suggestions?.length) {
            tagSchema = tagSchema.refine(
                (tag) => this.config.suggestions!.includes(tag),
                { message: 'Sadece önerilen tag\'ler seçilebilir' }
            );
        }

        let arraySchema = z.array(tagSchema);

        if (this.config.minTags !== undefined) {
            arraySchema = arraySchema.min(this.config.minTags, `En az ${this.config.minTags} tag eklemelisiniz`);
        }

        if (this.config.maxTags !== undefined) {
            arraySchema = arraySchema.max(this.config.maxTags, `En fazla ${this.config.maxTags} tag ekleyebilirsiniz`);
        }

        // Duplicate kontrolü
        if (!this.config.allowDuplicates) {
            arraySchema = arraySchema.refine(
                (tags) => new Set(tags).size === tags.length,
                { message: 'Aynı tag birden fazla eklenemez' }
            );
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
            const regex = new RegExp(`[${separators.join('')}]`);
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
