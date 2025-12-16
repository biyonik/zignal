import {
    BooleanField, ColorField,
    DateField,
    EmailField,
    NumberField,
    PasswordField, PhoneField,
    SelectField,
    StringField,
    TextareaField
} from "../fields";
import {SchemaFactory} from "./factory";
import {FieldJsonSchema} from "./interfaces/field-json-schema";

/**
 * SchemaFactory (The JSON-to-Field Transformer) - Extreme Hard Core Tests
 *
 * Bu test dosyası JSON şemasından dinamik field oluşturmayı test eder:
 * - Backend-driven form yapılandırması
 * - Tip dönüşümleri
 * - Config aktarımı
 * - Hata durumları ve fallback'ler
 * - Grup yapıları
 */
describe('SchemaFactory (The JSON-to-Field Transformer) Hard Core Tests', () => {

    let factory: SchemaFactory;

    beforeEach(() => {
        factory = new SchemaFactory();
    });

    // ==========================================================================
    // 1. SINGLE FIELD CREATION
    // ==========================================================================
    describe('Single Field Creation (createField)', () => {

        describe('Basic Field Types', () => {
            it('should create StringField from "string" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'string',
                    name: 'username',
                    label: 'Kullanıcı Adı'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(StringField);
                expect(field.name).toBe('username');
                expect(field.label).toBe('Kullanıcı Adı');
            });

            it('should create NumberField from "number" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'number',
                    name: 'age',
                    label: 'Yaş'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(NumberField);
            });

            it('should create BooleanField from "boolean" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'boolean',
                    name: 'active',
                    label: 'Aktif'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(BooleanField);
            });

            it('should create DateField from "date" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'date',
                    name: 'birthDate',
                    label: 'Doğum Tarihi'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(DateField);
            });
        });

        describe('Specialized Field Types', () => {
            it('should create EmailField from "email" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'email',
                    name: 'email',
                    label: 'E-posta'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(EmailField);
            });

            it('should create PasswordField from "password" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'password',
                    name: 'password',
                    label: 'Şifre'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(PasswordField);
            });

            it('should create TextareaField from "textarea" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'textarea',
                    name: 'bio',
                    label: 'Biyografi'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(TextareaField);
            });

            it('should create TextareaField from "text" type (alias)', () => {
                const schema: FieldJsonSchema = {
                    type: 'text',
                    name: 'description',
                    label: 'Açıklama'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(TextareaField);
            });

            it('should create SelectField from "select" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'select',
                    name: 'country',
                    label: 'Ülke',
                    config: {
                        options: [
                            { value: 'TR', label: 'Türkiye' },
                            { value: 'US', label: 'ABD' }
                        ]
                    }
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(SelectField);
            });

            it('should create ColorField from "color" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'color',
                    name: 'primaryColor',
                    label: 'Ana Renk'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(ColorField);
            });

            it('should create PhoneField from "phone" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'phone',
                    name: 'mobile',
                    label: 'Cep Telefonu'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(PhoneField);
            });
        });

        describe('Alias Types', () => {
            it('should create NumberField from "integer" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'integer',
                    name: 'count',
                    label: 'Sayı'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(NumberField);
            });

            it('should create NumberField from "decimal" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'decimal',
                    name: 'price',
                    label: 'Fiyat'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(NumberField);
            });

            it('should create BooleanField from "checkbox" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'checkbox',
                    name: 'agree',
                    label: 'Kabul Ediyorum'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(BooleanField);
            });

            it('should create BooleanField from "toggle" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'toggle',
                    name: 'notifications',
                    label: 'Bildirimler'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(BooleanField);
            });

            it('should create SelectField from "enum" type', () => {
                const schema: FieldJsonSchema = {
                    type: 'enum',
                    name: 'status',
                    label: 'Durum'
                };

                const field = factory.createField(schema);

                expect(field).toBeInstanceOf(SelectField);
            });
        });
    });

    // ==========================================================================
    // 2. CONFIG PASSING
    // ==========================================================================
    describe('Config Passing', () => {

        it('should pass required config to field', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'name',
                label: 'Ad',
                config: { required: true }
            };

            const field = factory.createField(schema);

            expect(field.config.required).toBe(true);
        });

        it('should pass validation configs (min/max)', () => {
            const schema: FieldJsonSchema = {
                type: 'number',
                name: 'age',
                label: 'Yaş',
                config: { min: 0, max: 150 }
            };

            const field = factory.createField(schema);

            expect((field.config as any).min).toBe(0);
            expect((field.config as any).max).toBe(150);

            // Verify validation works
            const zodSchema = field.schema();
            expect(zodSchema.safeParse(25).success).toBe(true);
            expect(zodSchema.safeParse(-5).success).toBe(false);
            expect(zodSchema.safeParse(200).success).toBe(false);
        });

        it('should pass string constraints (minLength/maxLength)', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'code',
                label: 'Kod',
                config: { minLength: 3, maxLength: 10 }
            };

            const field = factory.createField(schema);

            const zodSchema = field.schema();
            expect(zodSchema.safeParse('AB').success).toBe(false); // Too short
            expect(zodSchema.safeParse('ABC').success).toBe(true);
            expect(zodSchema.safeParse('12345678901').success).toBe(false); // Too long
        });

        it('should pass email-specific configs', () => {
            const schema: FieldJsonSchema = {
                type: 'email',
                name: 'workEmail',
                label: 'İş E-postası',
                config: {
                    required: true,
                    allowedDomains: ['company.com']
                }
            };

            const field = factory.createField(schema);

            expect((field.config as any).allowedDomains).toEqual(['company.com']);
        });

        it('should pass select options config', () => {
            const options = [
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' }
            ];

            const schema: FieldJsonSchema = {
                type: 'select',
                name: 'choice',
                label: 'Seçim',
                config: { options }
            };

            const field = factory.createField(schema);

            expect((field.config as any).options).toEqual(options);
        });

        it('should pass password strength configs', () => {
            const schema: FieldJsonSchema = {
                type: 'password',
                name: 'password',
                label: 'Şifre',
                config: {
                    minLength: 12,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumber: true,
                    requireSpecial: true
                }
            };

            const field = factory.createField(schema);

            expect((field.config as any).minLength).toBe(12);
            expect((field.config as any).requireUppercase).toBe(true);
        });

        it('should pass defaultValue to config', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'status',
                label: 'Durum',
                defaultValue: 'active'
            };

            const field = factory.createField(schema);

            expect(field.config.defaultValue).toBe('active');
        });
    });

    // ==========================================================================
    // 3. BATCH FIELD CREATION (parse)
    // ==========================================================================
    describe('Batch Field Creation (parse)', () => {

        it('should parse multiple schemas at once', () => {
            const schemas: FieldJsonSchema[] = [
                { type: 'string', name: 'firstName', label: 'Ad' },
                { type: 'string', name: 'lastName', label: 'Soyad' },
                { type: 'email', name: 'email', label: 'E-posta' },
                { type: 'number', name: 'age', label: 'Yaş' }
            ];

            const fields = factory.parse(schemas);

            expect(fields.length).toBe(4);
            expect(fields[0]).toBeInstanceOf(StringField);
            expect(fields[1]).toBeInstanceOf(StringField);
            expect(fields[2]).toBeInstanceOf(EmailField);
            expect(fields[3]).toBeInstanceOf(NumberField);
        });

        it('should preserve order of fields', () => {
            const schemas: FieldJsonSchema[] = [
                { type: 'string', name: 'first', label: 'First' },
                { type: 'string', name: 'second', label: 'Second' },
                { type: 'string', name: 'third', label: 'Third' }
            ];

            const fields = factory.parse(schemas);

            expect(fields[0].name).toBe('first');
            expect(fields[1].name).toBe('second');
            expect(fields[2].name).toBe('third');
        });

        it('should handle empty array', () => {
            const fields = factory.parse([]);

            expect(fields).toEqual([]);
        });

        it('should handle single item array', () => {
            const schemas: FieldJsonSchema[] = [
                { type: 'boolean', name: 'single', label: 'Single' }
            ];

            const fields = factory.parse(schemas);

            expect(fields.length).toBe(1);
            expect(fields[0].name).toBe('single');
        });
    });

    // ==========================================================================
    // 4. GROUPED FIELDS (parseGroups)
    // ==========================================================================
    describe('Grouped Fields (parseGroups)', () => {

        it('should parse fields into groups', () => {
            const groups = {
                personal: [
                    { type: 'string', name: 'name', label: 'Ad' },
                    { type: 'date', name: 'birthDate', label: 'Doğum Tarihi' }
                ],
                contact: [
                    { type: 'email', name: 'email', label: 'E-posta' },
                    { type: 'phone', name: 'phone', label: 'Telefon' }
                ]
            } as Record<string, FieldJsonSchema[]>;

            const result = factory.parseGroups(groups);

            expect(Object.keys(result)).toEqual(['personal', 'contact']);
            expect(result.personal.length).toBe(2);
            expect(result.contact.length).toBe(2);

            expect(result.personal[0]).toBeInstanceOf(StringField);
            expect(result.contact[0]).toBeInstanceOf(EmailField);
        });

        it('should preserve group names', () => {
            const groups = {
                'step-1': [{ type: 'string', name: 'a', label: 'A' }],
                'step-2': [{ type: 'string', name: 'b', label: 'B' }],
                'step-3': [{ type: 'string', name: 'c', label: 'C' }]
            } as Record<string, FieldJsonSchema[]>;

            const result = factory.parseGroups(groups);

            expect(Object.keys(result)).toEqual(['step-1', 'step-2', 'step-3']);
        });

        it('should handle empty groups', () => {
            const groups = {
                empty: []
            } as Record<string, FieldJsonSchema[]>;

            const result = factory.parseGroups(groups);

            expect(result.empty).toEqual([]);
        });

        it('should handle single group', () => {
            const groups = {
                only: [
                    { type: 'string', name: 'field1', label: 'Field 1' },
                    { type: 'number', name: 'field2', label: 'Field 2' }
                ]
            } as Record<string, FieldJsonSchema[]>;

            const result = factory.parseGroups(groups);

            expect(Object.keys(result).length).toBe(1);
            expect(result.only.length).toBe(2);
        });
    });

    // ==========================================================================
    // 5. FALLBACK & ERROR HANDLING
    // ==========================================================================
    describe('Fallback & Error Handling', () => {

        it('should fallback to StringField for unknown type (with warning)', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            const schema: FieldJsonSchema = {
                type: 'unknown_type',
                name: 'mystery',
                label: 'Gizemli Alan'
            };

            const field = factory.createField(schema);

            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(field).toBeInstanceOf(StringField);
            expect(field.name).toBe('mystery');

            consoleWarnSpy.mockRestore();
        });

        it('should use field name as label if label not provided', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'myFieldName'
                // No label provided
            };

            const field = factory.createField(schema);

            expect(field.label).toBe('myFieldName');
        });

        it('should handle missing config gracefully', () => {
            const schema: FieldJsonSchema = {
                type: 'number',
                name: 'count',
                label: 'Sayı'
                // No config provided
            };

            const field = factory.createField(schema);

            expect(field).toBeInstanceOf(NumberField);
            expect(field.config).toBeDefined();
        });

        it('should handle error during field creation (fallback)', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // This might cause an error in some edge cases
            const schema: FieldJsonSchema = {
                type: 'select',
                name: 'broken',
                label: 'Broken',
                config: {
                    // Invalid config that might cause issues
                    options: null as any
                }
            };

            // Should not throw, should return fallback
            const field = factory.createField(schema);

            expect(field).toBeDefined();

            consoleErrorSpy.mockRestore();
        });
    });

    // ==========================================================================
    // 6. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('should handle complete user registration form schema', () => {
            const formSchema: FieldJsonSchema[] = [
                {
                    type: 'string',
                    name: 'firstName',
                    label: 'Ad',
                    config: { required: true, minLength: 2 }
                },
                {
                    type: 'string',
                    name: 'lastName',
                    label: 'Soyad',
                    config: { required: true, minLength: 2 }
                },
                {
                    type: 'email',
                    name: 'email',
                    label: 'E-posta',
                    config: { required: true }
                },
                {
                    type: 'password',
                    name: 'password',
                    label: 'Şifre',
                    config: {
                        required: true,
                        minLength: 8,
                        requireUppercase: true,
                        requireNumber: true
                    }
                },
                {
                    type: 'phone',
                    name: 'phone',
                    label: 'Telefon'
                },
                {
                    type: 'date',
                    name: 'birthDate',
                    label: 'Doğum Tarihi'
                },
                {
                    type: 'select',
                    name: 'gender',
                    label: 'Cinsiyet',
                    config: {
                        options: [
                            { value: 'male', label: 'Erkek' },
                            { value: 'female', label: 'Kadın' },
                            { value: 'other', label: 'Diğer' }
                        ]
                    }
                },
                {
                    type: 'checkbox',
                    name: 'acceptTerms',
                    label: 'Şartları Kabul Ediyorum',
                    config: { required: true }
                }
            ];

            const fields = factory.parse(formSchema);

            expect(fields.length).toBe(8);
            expect(fields[0]).toBeInstanceOf(StringField);
            expect(fields[2]).toBeInstanceOf(EmailField);
            expect(fields[3]).toBeInstanceOf(PasswordField);
            expect(fields[4]).toBeInstanceOf(PhoneField);
            expect(fields[5]).toBeInstanceOf(DateField);
            expect(fields[6]).toBeInstanceOf(SelectField);
            expect(fields[7]).toBeInstanceOf(BooleanField);
        });

        it('should handle multi-step wizard form with groups', () => {
            const wizardSchema = {
                'Kişisel Bilgiler': [
                    { type: 'string', name: 'firstName', label: 'Ad' },
                    { type: 'string', name: 'lastName', label: 'Soyad' },
                    { type: 'date', name: 'birthDate', label: 'Doğum Tarihi' }
                ],
                'İletişim Bilgileri': [
                    { type: 'email', name: 'email', label: 'E-posta' },
                    { type: 'phone', name: 'phone', label: 'Telefon' },
                    { type: 'textarea', name: 'address', label: 'Adres' }
                ],
                'Hesap Ayarları': [
                    { type: 'password', name: 'password', label: 'Şifre' },
                    { type: 'select', name: 'language', label: 'Dil', config: { options: [{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }] } },
                    { type: 'toggle', name: 'newsletter', label: 'Bülten' }
                ]
            } as Record<string, FieldJsonSchema[]>;

            const groups = factory.parseGroups(wizardSchema);

            expect(Object.keys(groups).length).toBe(3);
            expect(groups['Kişisel Bilgiler'].length).toBe(3);
            expect(groups['İletişim Bilgileri'].length).toBe(3);
            expect(groups['Hesap Ayarları'].length).toBe(3);
        });

        it('should handle backend API response simulation', () => {
            // Simulating a backend response
            const apiResponse = {
                success: true,
                data: {
                    formId: 'user-profile',
                    fields: [
                        { type: 'string', name: 'displayName', label: 'Görünen Ad', config: { required: true } },
                        { type: 'textarea', name: 'bio', label: 'Hakkımda', config: { maxLength: 500 } },
                        { type: 'color', name: 'themeColor', label: 'Tema Rengi' },
                        { type: 'boolean', name: 'isPublic', label: 'Profil Herkese Açık' }
                    ]
                }
            };

            const fields = factory.parse(apiResponse.data.fields);

            expect(fields.length).toBe(4);
            expect(fields[0].name).toBe('displayName');
            expect(fields[0].config.required).toBe(true);
            expect(fields[2]).toBeInstanceOf(ColorField);
        });
    });

    // ==========================================================================
    // 7. EDGE CASES
    // ==========================================================================
    describe('Edge Cases', () => {

        it('should handle field name with special characters', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'user-name_field.test',
                label: 'Special Name'
            };

            const field = factory.createField(schema);

            expect(field.name).toBe('user-name_field.test');
        });

        it('should handle label with Unicode characters', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'greeting',
                label: '挨拶 🎉 مرحبا Привет'
            };

            const field = factory.createField(schema);

            expect(field.label).toBe('挨拶 🎉 مرحبا Привет');
        });

        it('should handle empty string values in config', () => {
            const schema: FieldJsonSchema = {
                type: 'string',
                name: 'test',
                label: '',
                config: { placeholder: '' }
            };

            const field = factory.createField(schema);

            expect(field.label).toBe(''); // Empty string is preserved
        });

        it('should handle large batch of fields', () => {
            const schemas: FieldJsonSchema[] = Array.from({ length: 100 }, (_, i) => ({
                type: 'string',
                name: `field_${i}`,
                label: `Field ${i}`
            }));

            const fields = factory.parse(schemas);

            expect(fields.length).toBe(100);
            expect(fields[0].name).toBe('field_0');
            expect(fields[99].name).toBe('field_99');
        });

        it('should handle deeply nested config objects', () => {
            const schema: FieldJsonSchema = {
                type: 'select',
                name: 'complex',
                label: 'Complex',
                config: {
                    options: [
                        { value: 'a', label: 'A', metadata: { nested: { deep: true } } },
                        { value: 'b', label: 'B', metadata: { nested: { deep: false } } }
                    ],
                    custom: {
                        level1: {
                            level2: {
                                level3: 'deep value'
                            }
                        }
                    }
                }
            };

            const field = factory.createField(schema);

            expect((field.config as any).custom.level1.level2.level3).toBe('deep value');
        });
    });
});