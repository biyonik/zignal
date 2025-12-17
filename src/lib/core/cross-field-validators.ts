/**
 * @fileoverview
 * TR: Cross-field (alanlar arası) validasyon sistemi.
 * Birden fazla alanı içeren validasyon kurallarını tanımlar.
 *
 * EN: Cross-field validation system.
 * Defines validation rules involving multiple fields.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Types & Interfaces
// EN: Types & Interfaces
// =============================================================================

import {FormDataType} from "./form-state";

/**
 * TR: Cross-field validator sonucu.
 * EN: Cross-field validator result.
 */
export interface CrossValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

/**
 * TR: Cross-field validator fonksiyonu.
 * EN: Cross-field validator function.
 */
export type CrossValidatorFn<T extends FormDataType> = (
    values: T
) => string | null;

/**
 * TR: Gelişmiş cross-field validator tanımı.
 * EN: Advanced cross-field validator definition.
 */
export interface CrossFieldValidatorDef<T extends FormDataType> {
    /**
     * TR: Validator'ın benzersiz adı.
     * EN: Unique name of the validator.
     */
    name: string;

    /**
     * TR: Hata mesajının atanacağı alanlar (opsiyonel).
     * EN: Fields to attach error message to (optional).
     */
    errorFields?: (keyof T)[];

    /**
     * TR: Bu validator'ın bağlı olduğu alanlar.
     * EN: Fields this validator depends on.
     */
    dependsOn: (keyof T)[];

    /**
     * TR: Validasyon fonksiyonu.
     * EN: Validation function.
     */
    validate: CrossValidatorFn<T>;

    /**
     * TR: Validator aktif mi? (conditional validation için)
     * EN: Is validator active? (for conditional validation)
     */
    when?: (values: T) => boolean;
}

// =============================================================================
// TR: Cross Validators - Hazır Validatorlar
// EN: Cross Validators - Ready-to-use Validators
// =============================================================================

/**
 * TR: Hazır cross-field validation pattern'leri.
 * EN: Ready-to-use cross-field validation patterns.
 */
export const CrossValidators = {
    /**
     * TR: İki alanın eşleşmesini kontrol eder (örn: şifre onayı).
     * EN: Checks if two fields match (e.g., password confirmation).
     *
     * @example
     * ```typescript
     * CrossValidators.fieldsMatch('password', 'confirmPassword', 'Şifreler eşleşmiyor')
     * ```
     */
    fieldsMatch<T extends FormDataType>(
        field1: keyof T,
        field2: keyof T,
        message: string = 'Alanlar eşleşmiyor'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `${String(field1)}_${String(field2)}_match`,
            dependsOn: [field1, field2],
            errorFields: [field2],
            validate: (values) => {
                if (values[field1] !== values[field2]) {
                    return message;
                }
                return null;
            }
        };
    },

    /**
     * TR: Şifre eşleştirmesi için özel validator.
     * EN: Special validator for password matching.
     */
    passwordMatch<T extends FormDataType>(
        passwordField: keyof T = 'password' as keyof T,
        confirmField: keyof T = 'confirmPassword' as keyof T,
        message: string = 'Şifreler eşleşmiyor'
    ): CrossFieldValidatorDef<T> {
        return this.fieldsMatch(passwordField, confirmField, message);
    },

    /**
     * TR: Email eşleştirmesi için özel validator.
     * EN: Special validator for email matching.
     */
    emailMatch<T extends FormDataType>(
        emailField: keyof T = 'email' as keyof T,
        confirmField: keyof T = 'confirmEmail' as keyof T,
        message: string = 'E-posta adresleri eşleşmiyor'
    ): CrossFieldValidatorDef<T> {
        return this.fieldsMatch(emailField, confirmField, message);
    },

    /**
     * TR: Tarih aralığı validasyonu (başlangıç < bitiş).
     * EN: Date range validation (start < end).
     *
     * @example
     * ```typescript
     * CrossValidators.dateRange('startDate', 'endDate', 'Başlangıç tarihi bitiş tarihinden önce olmalı')
     * ```
     */
    dateRange<T extends FormDataType>(
        startField: keyof T,
        endField: keyof T,
        message: string = 'Başlangıç tarihi bitiş tarihinden önce olmalıdır'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `${String(startField)}_${String(endField)}_dateRange`,
            dependsOn: [startField, endField],
            errorFields: [endField],
            validate: (values) => {
                const start = values[startField];
                const end = values[endField];

                if (!start || !end) return null; // Boş değerler valid

                // @ts-ignore
                const startDate: Date = start instanceof Date ? start : new Date(start as string);
                // @ts-ignore
                const endDate: Date = end instanceof Date ? end : new Date(end as string);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return null; // Geçersiz tarihler ayrı validasyonla kontrol edilir
                }

                if (startDate >= endDate) {
                    return message;
                }
                return null;
            }
        };
    },

    /**
     * TR: Sayı aralığı validasyonu (min < max).
     * EN: Number range validation (min < max).
     */
    numberRange<T extends FormDataType>(
        minField: keyof T,
        maxField: keyof T,
        message: string = 'Minimum değer maksimum değerden küçük olmalıdır'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `${String(minField)}_${String(maxField)}_numberRange`,
            dependsOn: [minField, maxField],
            errorFields: [maxField],
            validate: (values) => {
                const min = values[minField] as number | null | undefined;
                const max = values[maxField] as number | null | undefined;

                if (min == null || max == null) return null;

                if (min >= max) {
                    return message;
                }
                return null;
            }
        };
    },

    /**
     * TR: En az birinin dolu olması gerektiğini kontrol eder.
     * EN: Checks that at least one field is filled.
     *
     * @example
     * ```typescript
     * CrossValidators.atLeastOne(['phone', 'email'], 'Telefon veya e-posta girilmelidir')
     * ```
     */
    atLeastOne<T extends FormDataType>(
        fields: (keyof T)[],
        message: string = 'En az bir alan doldurulmalıdır'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `atLeastOne_${fields.join('_')}`,
            dependsOn: fields,
            validate: (values) => {
                const hasValue = fields.some(field => {
                    const val = values[field];
                    if (val == null) return false;
                    if (typeof val === 'string') return val.trim().length > 0;
                    if (Array.isArray(val)) return val.length > 0;
                    return true;
                });

                return hasValue ? null : message;
            }
        };
    },

    /**
     * TR: Tüm alanların dolu olması gerektiğini kontrol eder.
     * EN: Checks that all fields are filled.
     */
    allRequired<T extends FormDataType>(
        fields: (keyof T)[],
        message: string = 'Tüm alanlar doldurulmalıdır'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `allRequired_${fields.join('_')}`,
            dependsOn: fields,
            validate: (values) => {
                const allFilled = fields.every(field => {
                    const val = values[field];
                    if (val == null) return false;
                    if (typeof val === 'string') return val.trim().length > 0;
                    if (Array.isArray(val)) return val.length > 0;
                    return true;
                });

                return allFilled ? null : message;
            }
        };
    },

    /**
     * TR: Mutual exclusion - sadece biri dolu olabilir.
     * EN: Mutual exclusion - only one can be filled.
     */
    mutuallyExclusive<T extends FormDataType>(
        fields: (keyof T)[],
        message: string = 'Bu alanlardan sadece biri doldurulabilir'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `mutuallyExclusive_${fields.join('_')}`,
            dependsOn: fields,
            validate: (values) => {
                const filledCount = fields.filter(field => {
                    const val = values[field];
                    if (val == null) return false;
                    if (typeof val === 'string') return val.trim().length > 0;
                    if (Array.isArray(val)) return val.length > 0;
                    return true;
                }).length;

                return filledCount > 1 ? message : null;
            }
        };
    },

    /**
     * TR: Koşullu zorunluluk - bir alan doluysa diğeri de zorunlu.
     * EN: Conditional requirement - if one field is filled, another is required.
     *
     * @example
     * ```typescript
     * CrossValidators.requiredIf('hasCompany', true, 'companyName', 'Şirket adı zorunludur')
     * ```
     */
    requiredIf<T extends FormDataType>(
        triggerField: keyof T,
        triggerValue: unknown,
        requiredField: keyof T,
        message: string = 'Bu alan zorunludur'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `requiredIf_${String(triggerField)}_${String(requiredField)}`,
            dependsOn: [triggerField, requiredField],
            errorFields: [requiredField],
            validate: (values) => {
                if (values[triggerField] !== triggerValue) {
                    return null; // Koşul sağlanmadıysa valid
                }

                const val = values[requiredField];
                if (val == null) return message;
                if (typeof val === 'string' && val.trim().length === 0) return message;
                if (Array.isArray(val) && val.length === 0) return message;

                return null;
            }
        };
    },

    /**
     * TR: Koşullu zorunluluk - fonksiyon ile.
     * EN: Conditional requirement - with function.
     */
    requiredWhen<T extends FormDataType>(
        condition: (values: T) => boolean,
        requiredField: keyof T,
        message: string = 'Bu alan zorunludur'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `requiredWhen_${String(requiredField)}`,
            dependsOn: [requiredField],
            errorFields: [requiredField],
            when: condition,
            validate: (values) => {
                const val = values[requiredField];
                if (val == null) return message;
                if (typeof val === 'string' && val.trim().length === 0) return message;
                if (Array.isArray(val) && val.length === 0) return message;

                return null;
            }
        };
    },

    /**
     * TR: Toplam değer kontrolü (örn: yüzdeler toplamı 100 olmalı).
     * EN: Sum validation (e.g., percentages must sum to 100).
     */
    sumEquals<T extends FormDataType>(
        fields: (keyof T)[],
        targetSum: number,
        message: string = `Toplam ${targetSum} olmalıdır`
    ): CrossFieldValidatorDef<T> {
        return {
            name: `sumEquals_${fields.join('_')}`,
            dependsOn: fields,
            validate: (values) => {
                const sum = fields.reduce((acc, field) => {
                    const val = values[field];
                    return acc + (typeof val === 'number' ? val : 0);
                }, 0);

                return Math.abs(sum - targetSum) < 0.0001 ? null : message;
            }
        };
    },

    /**
     * TR: Benzersizlik kontrolü - alanlar farklı değerlere sahip olmalı.
     * EN: Uniqueness check - fields must have different values.
     */
    allDifferent<T extends FormDataType>(
        fields: (keyof T)[],
        message: string = 'Tüm alanlar farklı değerlere sahip olmalıdır'
    ): CrossFieldValidatorDef<T> {
        return {
            name: `allDifferent_${fields.join('_')}`,
            dependsOn: fields,
            validate: (values) => {
                const nonEmptyValues = fields
                    .map(f => values[f])
                    .filter(v => v != null && v !== '');

                const uniqueValues = new Set(nonEmptyValues.map(v => JSON.stringify(v)));

                return uniqueValues.size === nonEmptyValues.length ? null : message;
            }
        };
    },

    /**
     * TR: Custom validator oluşturma yardımcısı.
     * EN: Custom validator creation helper.
     *
     * @example
     * ```typescript
     * CrossValidators.custom(
     *   'ageCheck',
     *   ['birthDate', 'licenseDate'],
     *   (values) => {
     *     const birth = new Date(values.birthDate);
     *     const license = new Date(values.licenseDate);
     *     const ageAtLicense = (license.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
     *     return ageAtLicense < 18 ? 'Ehliyet yaşı en az 18 olmalıdır' : null;
     *   }
     * )
     * ```
     */
    custom<T extends FormDataType>(
        name: string,
        dependsOn: (keyof T)[],
        validate: CrossValidatorFn<T>,
        options: {
            errorFields?: (keyof T)[];
            when?: (values: T) => boolean;
        } = {}
    ): CrossFieldValidatorDef<T> {
        return {
            name,
            dependsOn,
            errorFields: options.errorFields,
            when: options.when,
            validate
        };
    }
};

// =============================================================================
// TR: Cross Validation Runner
// EN: Cross Validation Runner
// =============================================================================

/**
 * TR: Cross-field validasyonlarını çalıştıran yardımcı sınıf.
 * EN: Helper class that runs cross-field validations.
 */
export class CrossValidationRunner<T extends FormDataType> {
    constructor(
        private readonly validators: CrossFieldValidatorDef<T>[]
    ) {}

    /**
     * TR: Tüm cross-field validasyonlarını çalıştırır.
     * EN: Runs all cross-field validations.
     */
    validate(values: T): CrossValidationResult {
        const errors: Record<string, string> = {};
        let valid = true;

        for (const validator of this.validators) {
            // Conditional check
            if (validator.when && !validator.when(values)) {
                continue;
            }

            const error = validator.validate(values);
            if (error) {
                valid = false;
                errors[validator.name] = error;
            }
        }

        return { valid, errors };
    }

    /**
     * TR: Belirli alanlara ait validasyonları çalıştırır.
     * EN: Runs validations for specific fields.
     */
    validateFields(values: T, changedFields: (keyof T)[]): CrossValidationResult {
        const errors: Record<string, string> = {};
        let valid = true;

        for (const validator of this.validators) {
            // Check if this validator depends on any of the changed fields
            const isAffected = validator.dependsOn.some(f => changedFields.includes(f));
            if (!isAffected) continue;

            // Conditional check
            if (validator.when && !validator.when(values)) {
                continue;
            }

            const error = validator.validate(values);
            if (error) {
                valid = false;
                errors[validator.name] = error;
            }
        }

        return { valid, errors };
    }

    /**
     * TR: Validator listesine yeni validator ekler.
     * EN: Adds new validator to the list.
     */
    addValidator(validator: CrossFieldValidatorDef<T>): void {
        this.validators.push(validator);
    }

    /**
     * TR: Validator'ı isimle kaldırır.
     * EN: Removes validator by name.
     */
    removeValidator(name: string): boolean {
        const index = this.validators.findIndex(v => v.name === name);
        if (index > -1) {
            this.validators.splice(index, 1);
            return true;
        }
        return false;
    }
}

// =============================================================================
// TR: Exports
// EN: Exports
// =============================================================================

export type { CrossFieldValidator } from './form-state';
