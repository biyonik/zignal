import {
    FIELD_REGISTRY,
    registerFieldType,
    isFieldTypeRegistered,
    getRegisteredFieldTypes,
    FieldConstructor
} from './registry';
import { BaseField } from '../fields';
import { StringField } from '../fields';
import { NumberField } from '../fields';
import { BooleanField } from '../fields';
import { DateField } from '../fields';
import { SelectField } from '../fields';
import { PasswordField } from '../fields';
import { EmailField } from '../fields';
import { UrlField } from '../fields';
import { PhoneField } from '../fields';
import { ColorField } from '../fields';
import { FileField } from '../fields';
import { TextareaField } from '../fields';
import { MultiselectField } from '../fields';
import { GroupField } from '../fields';
import { z } from 'zod';

/**
 * FIELD_REGISTRY (The Type Router) - Extreme Hard Core Tests
 *
 * Bu test dosyası field registry sisteminin tüm yönlerini test eder:
 * - Tüm standart field tiplerinin kaydı
 * - Runtime'da dinamik tip ekleme
 * - Tip kontrol fonksiyonları
 * - Edge case'ler ve hata durumları
 */
describe('FIELD_REGISTRY (The Type Router) Hard Core Tests', () => {

    // ==========================================================================
    // 1. DEFAULT REGISTRY COMPLETENESS
    // ==========================================================================
    describe('Default Registry Completeness', () => {

        describe('Text Field Types', () => {
            it('should have "string" mapped to StringField', () => {
                expect(FIELD_REGISTRY['string']).toBe(StringField);
            });

            it('should have "text" mapped to TextareaField', () => {
                expect(FIELD_REGISTRY['text']).toBe(TextareaField);
            });

            it('should have "textarea" mapped to TextareaField', () => {
                expect(FIELD_REGISTRY['textarea']).toBe(TextareaField);
            });

            it('should have "password" mapped to PasswordField', () => {
                expect(FIELD_REGISTRY['password']).toBe(PasswordField);
            });

            it('should have "email" mapped to EmailField', () => {
                expect(FIELD_REGISTRY['email']).toBe(EmailField);
            });

            it('should have "url" mapped to UrlField', () => {
                expect(FIELD_REGISTRY['url']).toBe(UrlField);
            });

            it('should have "phone" mapped to PhoneField', () => {
                expect(FIELD_REGISTRY['phone']).toBe(PhoneField);
            });
        });

        describe('Numeric Field Types', () => {
            it('should have "number" mapped to NumberField', () => {
                expect(FIELD_REGISTRY['number']).toBe(NumberField);
            });

            it('should have "integer" mapped to NumberField', () => {
                expect(FIELD_REGISTRY['integer']).toBe(NumberField);
            });

            it('should have "decimal" mapped to NumberField', () => {
                expect(FIELD_REGISTRY['decimal']).toBe(NumberField);
            });
        });

        describe('Boolean Field Types', () => {
            it('should have "boolean" mapped to BooleanField', () => {
                expect(FIELD_REGISTRY['boolean']).toBe(BooleanField);
            });

            it('should have "checkbox" mapped to BooleanField', () => {
                expect(FIELD_REGISTRY['checkbox']).toBe(BooleanField);
            });

            it('should have "toggle" mapped to BooleanField', () => {
                expect(FIELD_REGISTRY['toggle']).toBe(BooleanField);
            });
        });

        describe('Date Field Types', () => {
            it('should have "date" mapped to DateField', () => {
                expect(FIELD_REGISTRY['date']).toBe(DateField);
            });
        });

        describe('Selection Field Types', () => {
            it('should have "select" mapped to SelectField', () => {
                expect(FIELD_REGISTRY['select']).toBe(SelectField);
            });

            it('should have "enum" mapped to SelectField', () => {
                expect(FIELD_REGISTRY['enum']).toBe(SelectField);
            });

            it('should have "multiselect" mapped to MultiselectField', () => {
                expect(FIELD_REGISTRY['multiselect']).toBe(MultiselectField);
            });
        });

        describe('Special Field Types', () => {
            it('should have "color" mapped to ColorField', () => {
                expect(FIELD_REGISTRY['color']).toBe(ColorField);
            });

            it('should have "file" mapped to FileField', () => {
                expect(FIELD_REGISTRY['file']).toBe(FileField);
            });
        });

        describe('Complex Field Types', () => {
            it('should have "group" mapped to GroupField', () => {
                expect(FIELD_REGISTRY['group']).toBe(GroupField);
            });
        });
    });

    // ==========================================================================
    // 2. FIELD INSTANTIATION FROM REGISTRY
    // ==========================================================================
    describe('Field Instantiation from Registry', () => {

        it('should instantiate StringField from registry', () => {
            const FieldClass = FIELD_REGISTRY['string'];
            const field = new FieldClass('name', 'İsim', { required: true });

            expect(field).toBeInstanceOf(StringField);
            expect(field.name).toBe('name');
            expect(field.label).toBe('İsim');
        });

        it('should instantiate NumberField from registry', () => {
            const FieldClass = FIELD_REGISTRY['number'];
            const field = new FieldClass('age', 'Yaş', { min: 0, max: 150 });

            expect(field).toBeInstanceOf(NumberField);
            const schema = field.schema();
            expect(schema.safeParse(25).success).toBe(true);
            expect(schema.safeParse(-5).success).toBe(false);
        });

        it('should instantiate BooleanField from registry', () => {
            const FieldClass = FIELD_REGISTRY['boolean'];
            const field = new FieldClass('active', 'Aktif');

            expect(field).toBeInstanceOf(BooleanField);
            expect(field.schema().safeParse(true).success).toBe(true);
        });

        it('should instantiate EmailField from registry', () => {
            const FieldClass = FIELD_REGISTRY['email'];
            const field = new FieldClass('email', 'E-posta', { required: true });

            expect(field).toBeInstanceOf(EmailField);
            expect(field.schema().safeParse('valid@example.com').success).toBe(true);
            expect(field.schema().safeParse('invalid').success).toBe(false);
        });

        it('should instantiate PasswordField from registry', () => {
            const FieldClass = FIELD_REGISTRY['password'];
            const field = new FieldClass('pass', 'Şifre', { minLength: 8 });

            expect(field).toBeInstanceOf(PasswordField);
        });

        it('should instantiate DateField from registry', () => {
            const FieldClass = FIELD_REGISTRY['date'];
            const field = new FieldClass('birthDate', 'Doğum Tarihi');

            expect(field).toBeInstanceOf(DateField);
        });

        it('should instantiate SelectField from registry', () => {
            const FieldClass = FIELD_REGISTRY['select'];
            const field = new FieldClass('status', 'Durum', {
                options: [
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Pasif' }
                ]
            });

            expect(field).toBeInstanceOf(SelectField);
        });

        it('should instantiate ColorField from registry', () => {
            const FieldClass = FIELD_REGISTRY['color'];
            const field = new FieldClass('primaryColor', 'Ana Renk');

            expect(field).toBeInstanceOf(ColorField);
        });

        it('should instantiate FileField from registry', () => {
            const FieldClass = FIELD_REGISTRY['file'];
            const field = new FieldClass('avatar', 'Profil Fotoğrafı', {
                accept: ['image/jpeg', 'image/png'],
                maxSize: 5 * 1024 * 1024
            });

            expect(field).toBeInstanceOf(FileField);
        });
    });

    // ==========================================================================
    // 3. TYPE CHECK FUNCTIONS
    // ==========================================================================
    describe('Type Check Functions', () => {

        describe('isFieldTypeRegistered()', () => {
            it('should return true for registered types', () => {
                expect(isFieldTypeRegistered('string')).toBe(true);
                expect(isFieldTypeRegistered('number')).toBe(true);
                expect(isFieldTypeRegistered('email')).toBe(true);
                expect(isFieldTypeRegistered('password')).toBe(true);
                expect(isFieldTypeRegistered('select')).toBe(true);
            });

            it('should return false for non-registered types', () => {
                expect(isFieldTypeRegistered('nonexistent')).toBe(false);
                expect(isFieldTypeRegistered('custom')).toBe(false);
                expect(isFieldTypeRegistered('')).toBe(false);
            });

            it('should be case-sensitive', () => {
                expect(isFieldTypeRegistered('String')).toBe(false);
                expect(isFieldTypeRegistered('STRING')).toBe(false);
                expect(isFieldTypeRegistered('string')).toBe(true);
            });
        });

        describe('getRegisteredFieldTypes()', () => {
            it('should return all registered type keys', () => {
                const types = getRegisteredFieldTypes();

                expect(types).toContain('string');
                expect(types).toContain('number');
                expect(types).toContain('boolean');
                expect(types).toContain('email');
                expect(types).toContain('password');
                expect(types).toContain('select');
                expect(types).toContain('date');
                expect(types).toContain('color');
                expect(types).toContain('file');
            });

            it('should return array type', () => {
                const types = getRegisteredFieldTypes();
                expect(Array.isArray(types)).toBe(true);
            });

            it('should have minimum expected count', () => {
                const types = getRegisteredFieldTypes();
                // At least: string, number, boolean, date, select, text, textarea,
                // password, email, url, phone, integer, decimal, checkbox, toggle,
                // enum, multiselect, color, file, group
                expect(types.length).toBeGreaterThanOrEqual(15);
            });
        });
    });

    // ==========================================================================
    // 4. DYNAMIC TYPE REGISTRATION
    // ==========================================================================
    describe('Dynamic Type Registration', () => {

        // Custom field for testing
        class CurrencyField extends BaseField<number> {
            constructor(name: string, label: string, config: any = {}) {
                super(name, label, config);
            }

            schema() {
                return z.number().min(0, 'Para birimi negatif olamaz');
            }
        }

        // Cleanup after each test
        afterEach(() => {
            // Remove test types if they exist
            if ('currency' in FIELD_REGISTRY) {
                delete FIELD_REGISTRY['currency'];
            }
            if ('custom_test' in FIELD_REGISTRY) {
                delete FIELD_REGISTRY['custom_test'];
            }
        });

        it('should register new field type', () => {
            expect(isFieldTypeRegistered('currency')).toBe(false);

            registerFieldType('currency', CurrencyField);

            expect(isFieldTypeRegistered('currency')).toBe(true);
            expect(FIELD_REGISTRY['currency']).toBe(CurrencyField);
        });

        it('should allow instantiation of registered custom type', () => {
            registerFieldType('currency', CurrencyField);

            const FieldClass = FIELD_REGISTRY['currency'];
            const field = new FieldClass('price', 'Fiyat');

            expect(field).toBeInstanceOf(CurrencyField);
            expect(field.name).toBe('price');
        });

        it('should overwrite existing type with warning (spy on console)', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // First registration
            registerFieldType('custom_test', StringField);
            expect(FIELD_REGISTRY['custom_test']).toBe(StringField);

            // Overwrite
            registerFieldType('custom_test', NumberField);

            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(FIELD_REGISTRY['custom_test']).toBe(NumberField);

            consoleWarnSpy.mockRestore();
        });

        it('should handle registering same type twice silently (same class)', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            registerFieldType('currency', CurrencyField);
            registerFieldType('currency', CurrencyField);

            // Warning should still be called even if same class
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });

    // ==========================================================================
    // 5. ALIAS TYPES (Multiple Names for Same Field)
    // ==========================================================================
    describe('Alias Types', () => {

        it('should allow multiple aliases to same field class', () => {
            // text and textarea both map to TextareaField
            expect(FIELD_REGISTRY['text']).toBe(FIELD_REGISTRY['textarea']);

            // integer and decimal both map to NumberField
            expect(FIELD_REGISTRY['integer']).toBe(FIELD_REGISTRY['number']);
            expect(FIELD_REGISTRY['decimal']).toBe(FIELD_REGISTRY['number']);

            // checkbox and toggle both map to BooleanField
            expect(FIELD_REGISTRY['checkbox']).toBe(FIELD_REGISTRY['boolean']);
            expect(FIELD_REGISTRY['toggle']).toBe(FIELD_REGISTRY['boolean']);

            // enum maps to SelectField
            expect(FIELD_REGISTRY['enum']).toBe(FIELD_REGISTRY['select']);
        });

        it('should create equivalent instances from aliases', () => {
            const TextField = FIELD_REGISTRY['text'];
            const TextareaFieldAlias = FIELD_REGISTRY['textarea'];

            const field1 = new TextField('bio', 'Biyografi');
            const field2 = new TextareaFieldAlias('about', 'Hakkında');

            expect(field1.constructor).toBe(field2.constructor);
        });
    });

    // ==========================================================================
    // 6. EDGE CASES
    // ==========================================================================
    describe('Edge Cases', () => {

        it('should handle undefined type lookup gracefully', () => {
            const FieldClass = FIELD_REGISTRY['nonexistent'];
            expect(FieldClass).toBeUndefined();
        });

        it('should handle empty string type lookup', () => {
            const FieldClass = FIELD_REGISTRY[''];
            expect(FieldClass).toBeUndefined();
        });

        it('should handle type with special characters in lookup', () => {
            // These should not exist
            expect(FIELD_REGISTRY['string@#$']).toBeUndefined();
            expect(FIELD_REGISTRY['number.1']).toBeUndefined();
        });

        it('should preserve registry after multiple operations', () => {
            const initialTypes = getRegisteredFieldTypes().length;

            // Perform various operations
            isFieldTypeRegistered('string');
            isFieldTypeRegistered('nonexistent');
            getRegisteredFieldTypes();

            // Registry should be unchanged
            expect(getRegisteredFieldTypes().length).toBe(initialTypes);
        });
    });

    // ==========================================================================
    // 7. TYPE SAFETY VERIFICATION
    // ==========================================================================
    describe('Type Safety Verification', () => {

        it('should all registered classes extend BaseField', () => {
            const types = getRegisteredFieldTypes();

            for (const type of types) {
                const FieldClass = FIELD_REGISTRY[type];
                expect(FieldClass).toBeDefined();

                // Create instance and verify it has required methods
                const field = new FieldClass('test', 'Test');
                expect(typeof field.schema).toBe('function');
                expect(typeof field.name).toBe('string');
                expect(typeof field.label).toBe('string');
            }
        });

        it('should all registered fields implement IField interface', () => {
            const types = getRegisteredFieldTypes();

            for (const type of types) {
                const FieldClass = FIELD_REGISTRY[type];
                const field = new FieldClass('test', 'Test', {});

                // IField required properties
                expect(field.name).toBeDefined();
                expect(field.label).toBeDefined();
                expect(field.config).toBeDefined();

                // IField required methods
                expect(typeof field.schema).toBe('function');
                expect(typeof field.createValue).toBe('function');
                expect(typeof field.present).toBe('function');
                expect(typeof field.toExport).toBe('function');
                expect(typeof field.fromImport).toBe('function');
            }
        });
    });

    // ==========================================================================
    // 8. REGISTRY IMMUTABILITY (Behavioral)
    // ==========================================================================
    describe('Registry Behavior', () => {

        it('should return same class reference on multiple lookups', () => {
            const first = FIELD_REGISTRY['string'];
            const second = FIELD_REGISTRY['string'];
            const third = FIELD_REGISTRY['string'];

            expect(first).toBe(second);
            expect(second).toBe(third);
        });

        it('should not affect other types when modifying one', () => {
            const originalNumber = FIELD_REGISTRY['number'];
            const originalString = FIELD_REGISTRY['string'];

            // This should not affect 'string'
            registerFieldType('number', BooleanField);

            expect(FIELD_REGISTRY['string']).toBe(originalString);

            // Restore
            FIELD_REGISTRY['number'] = originalNumber;
        });
    });

    // ==========================================================================
    // 9. REAL-WORLD USAGE PATTERNS
    // ==========================================================================
    describe('Real-World Usage Patterns', () => {

        it('should support dynamic form generation from type strings', () => {
            const fieldConfigs = [
                { type: 'string', name: 'name', label: 'İsim' },
                { type: 'email', name: 'email', label: 'E-posta' },
                { type: 'number', name: 'age', label: 'Yaş' },
                { type: 'boolean', name: 'active', label: 'Aktif' }
            ];

            const fields = fieldConfigs.map(config => {
                const FieldClass = FIELD_REGISTRY[config.type];
                if (!FieldClass) {
                    throw new Error(`Unknown field type: ${config.type}`);
                }
                return new FieldClass(config.name, config.label);
            });

            expect(fields.length).toBe(4);
            expect(fields[0]).toBeInstanceOf(StringField);
            expect(fields[1]).toBeInstanceOf(EmailField);
            expect(fields[2]).toBeInstanceOf(NumberField);
            expect(fields[3]).toBeInstanceOf(BooleanField);
        });

        it('should support fallback for unknown types', () => {
            const getFieldClass = (type: string): FieldConstructor => {
                return FIELD_REGISTRY[type] ?? StringField;
            };

            expect(getFieldClass('string')).toBe(StringField);
            expect(getFieldClass('unknown_type')).toBe(StringField);
        });

        it('should support conditional field creation based on type', () => {
            const createField = (type: string, name: string, label: string) => {
                if (!isFieldTypeRegistered(type)) {
                    console.warn(`Type ${type} not registered, using string`);
                    return new StringField(name, label);
                }

                const FieldClass = FIELD_REGISTRY[type];
                return new FieldClass(name, label);
            };

            const validField = createField('email', 'email', 'E-posta');
            expect(validField).toBeInstanceOf(EmailField);

            const fallbackField = createField('custom', 'custom', 'Custom');
            expect(fallbackField).toBeInstanceOf(StringField);
        });
    });
});