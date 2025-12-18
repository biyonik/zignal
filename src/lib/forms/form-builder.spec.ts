import {StringField, NumberField, EmailField, BooleanField, DateField, PasswordField} from '../fields';
import { FieldValue, IField, SchemaFactory } from '../core';

/**
 * Form Builder & Integration Tests
 *
 * Bu testler form oluşturma ve yönetim senaryolarını test eder.
 */

// Form state helper
interface FormState<T extends Record<string, any>> {
    fields: Record<keyof T, FieldValue<any>>;
    isValid: () => boolean;
    getValues: () => T;
    setValues: (values: Partial<T>) => void;
    reset: () => void;
    markAllTouched: () => void;
    getErrors: () => Record<string, string | null>;
}

// Simple form builder
function createForm<T extends Record<string, IField<any>>>(
    fields: T
): FormState<{ [K in keyof T]: ReturnType<T[K]['createValue']>['value'] extends { (): infer V } ? V : never }> {
    const fieldStates: Record<string, FieldValue<any>> = {};

    for (const [name, field] of Object.entries(fields)) {
        fieldStates[name] = field.createValue(field.config.defaultValue);
    }

    return {
        fields: fieldStates as any,
        isValid: () => Object.values(fieldStates).every(state => state.valid()),
        getValues: () => {
            const values: Record<string, any> = {};
            for (const [name, state] of Object.entries(fieldStates)) {
                values[name] = state.value();
            }
            return values as any;
        },
        setValues: (values) => {
            for (const [name, value] of Object.entries(values)) {
                if (fieldStates[name]) {
                    fieldStates[name].value.set(value);
                }
            }
        },
        reset: () => {
            for (const [name, field] of Object.entries(fields)) {
                fieldStates[name].value.set(field.config.defaultValue);
                fieldStates[name].touched.set(false);
            }
        },
        markAllTouched: () => {
            for (const state of Object.values(fieldStates)) {
                state.touched.set(true);
            }
        },
        getErrors: () => {
            const errors: Record<string, string | null> = {};
            for (const [name, state] of Object.entries(fieldStates)) {
                errors[name] = state.error();
            }
            return errors;
        }
    };
}

describe('Form Builder Integration Tests', () => {

    describe('Basic Form Creation', () => {
        it('should create form with multiple fields', () => {
            const form = createForm({
                name: new StringField('name', 'Ad', { required: true }),
                email: new EmailField('email', 'E-posta', { required: true }),
                age: new NumberField('age', 'Yaş', { min: 0 })
            });

            expect(form.fields.name).toBeDefined();
            expect(form.fields.email).toBeDefined();
            expect(form.fields.age).toBeDefined();
        });

        it('should validate all fields', () => {
            const form = createForm({
                name: new StringField('name', 'Ad', { required: true }),
                email: new EmailField('email', 'E-posta', { required: true })
            });

            expect(form.isValid()).toBe(false);

            form.setValues({
                name: 'John',
                email: 'john@example.com'
            });

            expect(form.isValid()).toBe(true);
        });

        it('should get all values', () => {
            const form = createForm({
                name: new StringField('name', 'Ad'),
                active: new BooleanField('active', 'Aktif')
            });

            form.setValues({
                name: 'Test User',
                active: true
            });

            const values = form.getValues();
            expect(values.name).toBe('Test User');
            expect(values.active).toBe(true);
        });

        it('should reset form', () => {
            const form = createForm({
                name: new StringField('name', 'Ad', { defaultValue: '' }),
                count: new NumberField('count', 'Sayı', { defaultValue: 0 })
            });

            form.setValues({ name: 'Changed', count: 100 });
            form.fields.name.touched.set(true);

            form.reset();

            expect(form.getValues().name).toBe('');
            expect(form.getValues().count).toBe(0);
            expect(form.fields.name.touched()).toBe(false);
        });
    });

    describe('Form Validation', () => {
        it('should collect all errors', () => {
            const form = createForm({
                name: new StringField('name', 'Ad', { required: true }),
                email: new EmailField('email', 'E-posta', { required: true })
            });

            form.markAllTouched();

            const errors = form.getErrors();
            expect(errors.name).toBeTruthy();
            expect(errors.email).toBeTruthy();
        });

        it('should clear errors when valid', () => {
            const form = createForm({
                email: new EmailField('email', 'E-posta', { required: true })
            });

            form.fields.email.touched.set(true);
            expect(form.fields.email.error()).toBeTruthy();

            form.setValues({ email: 'valid@email.com' });
            expect(form.fields.email.error()).toBeNull();
        });
    });

    describe('User Registration Form Scenario', () => {
        let form: FormState<any>;

        beforeEach(() => {
            form = createForm({
                firstName: new StringField('firstName', 'Ad', { required: true }),
                lastName: new StringField('lastName', 'Soyad', { required: true }),
                email: new EmailField('email', 'E-posta', { required: true }),
                password: new PasswordField('password', 'Şifre', {
                    required: true,
                    minLength: 8,
                    requireUppercase: true,
                    requireNumber: true
                }),
                birthDate: new DateField('birthDate', 'Doğum Tarihi'),
                acceptTerms: new BooleanField('acceptTerms', 'Şartları Kabul Ediyorum', { required: true })
            });
        });

        it('should be invalid when empty', () => {
            expect(form.isValid()).toBe(false);
        });

        it('should validate required fields', () => {
            form.markAllTouched();

            const errors = form.getErrors();
            expect(errors.firstName).toBeTruthy();
            expect(errors.lastName).toBeTruthy();
            expect(errors.email).toBeTruthy();
            expect(errors.password).toBeTruthy();
            expect(errors.acceptTerms).toBeTruthy();
        });

        it('should be valid with correct data', () => {
            form.setValues({
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                email: 'ahmet@example.com',
                password: 'SecurePass123',
                birthDate: new Date(1990, 0, 1),
                acceptTerms: true
            });

            expect(form.isValid()).toBe(true);
        });

        it('should validate email format', () => {
            form.setValues({ email: 'invalid-email' });
            form.fields.email.touched.set(true);

            expect(form.fields.email.error()).toBeTruthy();
        });

        it('should validate password requirements', () => {
            form.setValues({ password: 'weak' });
            form.fields.password.touched.set(true);

            expect(form.fields.password.error()).toBeTruthy();
        });
    });

    describe('Dynamic Form with SchemaFactory', () => {
        let factory: SchemaFactory;

        beforeEach(() => {
            factory = new SchemaFactory();
        });

        it('should create fields from JSON schema', () => {
            const schemas = [
                { type: 'string', name: 'title', label: 'Başlık', config: { required: true } },
                { type: 'textarea', name: 'description', label: 'Açıklama' },
                { type: 'number', name: 'price', label: 'Fiyat', config: { min: 0 } },
                { type: 'boolean', name: 'active', label: 'Aktif' }
            ];

            const fields = factory.parse(schemas);

            expect(fields.length).toBe(4);
            expect(fields[0].name).toBe('title');
            expect(fields[1].name).toBe('description');
            expect(fields[2].name).toBe('price');
            expect(fields[3].name).toBe('active');
        });

        it('should create form from dynamic fields', () => {
            const schemas = [
                { type: 'string', name: 'username', label: 'Kullanıcı Adı', config: { required: true } },
                { type: 'email', name: 'email', label: 'E-posta', config: { required: true } }
            ];

            const fields = factory.parse(schemas);
            const fieldMap: Record<string, IField<any>> = {};

            for (const field of fields) {
                fieldMap[field.name] = field;
            }

            const form = createForm(fieldMap);

            expect(form.isValid()).toBe(false);

            form.setValues({
                username: 'testuser',
                email: 'test@example.com'
            });

            expect(form.isValid()).toBe(true);
        });
    });

    describe('Form Data Export/Import', () => {
        it('should export form data', () => {
            const fields = {
                name: new StringField('name', 'Ad'),
                birthDate: new DateField('birthDate', 'Doğum Tarihi'),
                active: new BooleanField('active', 'Aktif')
            };

            const form = createForm(fields);
            const date = new Date(2000, 5, 15);

            form.setValues({
                name: 'Test User',
                birthDate: date,
                active: true
            });

            const exported: Record<string, any> = {};
            for (const [name, field] of Object.entries(fields)) {
                exported[name] = field.toExport(form.fields[name].value());
            }

            expect(exported.name).toBe('Test User');
            expect(exported.birthDate).toBe(date.toISOString());
            expect(exported.active).toBe(true);
        });

        it('should import form data', () => {
            const fields = {
                email: new EmailField('email', 'E-posta'),
                count: new NumberField('count', 'Sayı')
            };

            const importData = {
                email: 'IMPORT@EXAMPLE.COM',
                count: 42
            };

            const form = createForm(fields);

            for (const [name, field] of Object.entries(fields)) {
                const imported = field.fromImport(importData[name as keyof typeof importData]);
                if (imported !== null) {
                    form.fields[name].value.set(imported);
                }
            }

            expect(form.getValues().email).toBe('IMPORT@EXAMPLE.COM');
            expect(form.getValues().count).toBe(42);
        });
    });

    describe('Form Field Dependencies', () => {
        it('should handle conditional field visibility', () => {
            const hasCompany = new BooleanField('hasCompany', 'Şirket Var mı?');
            const companyName = new StringField('companyName', 'Şirket Adı', { required: true });

            const hasCompanyState = hasCompany.createValue(false);
            const companyNameState = companyName.createValue('');

            // Simulate conditional logic
            const isCompanyNameRequired = () => hasCompanyState.value() === true;
            const isCompanyNameValid = () => {
                if (!isCompanyNameRequired()) return true;
                return companyNameState.valid();
            };

            expect(isCompanyNameValid()).toBe(true); // Not required when hasCompany is false

            hasCompanyState.value.set(true);
            expect(isCompanyNameValid()).toBe(false); // Now required but empty

            companyNameState.value.set('Acme Corp');
            expect(isCompanyNameValid()).toBe(true); // Valid with value
        });
    });
});
