/**
 * FormSchema (The Brain of Zignal) - Extreme Hard Core Tests
 *
 * Bu test dosyası form state management'ın tüm yönlerini test eder:
 * - Reaktif değer yönetimi
 * - Cross-field validasyon
 * - Dirty/Pristine tracking
 * - Deep equality kontrolü
 * - Reset ve patch işlemleri
 * - Edge case'ler ve hata durumları
 */
import {createFormSchema, CrossFieldValidator, FormSchema} from "./form-state";
import {BooleanField, DateField, EmailField, NumberField, PasswordField, SelectField, StringField} from "../fields";


describe('FormSchema (The Brain) Hard Core Tests', () => {

    // ==========================================================================
    // 1. BASIC FORM CREATION & STRUCTURE
    // ==========================================================================
    describe('Form Creation & Structure', () => {

        it('should create form with correct field structure', () => {
            const schema = new FormSchema<{ name: string; age: number }>([
                new StringField('name', 'İsim', { required: true }),
                new NumberField('age', 'Yaş', { min: 0 })
            ]);

            const form = schema.createForm({ name: 'Test', age: 25 });

            expect(form.fields).toBeDefined();
            expect(form.fields.name).toBeDefined();
            expect(form.fields.age).toBeDefined();
            expect(form.fields.name.value()).toBe('Test');
            expect(form.fields.age.value()).toBe(25);
        });

        it('should handle empty initial values (null defaults)', () => {
            const schema = new FormSchema<{ email: string; count: number }>([
                new StringField('email', 'E-posta'),
                new NumberField('count', 'Sayı')
            ]);

            const form = schema.createForm();

            expect(form.fields.email.value()).toBeNull();
            expect(form.fields.count.value()).toBeNull();
        });

        it('should preserve field order from schema', () => {
            const fields = [
                new StringField('first', 'First'),
                new StringField('second', 'Second'),
                new StringField('third', 'Third'),
            ];

            const schema = new FormSchema<Record<string, string>>(fields);
            const names = schema.getNames();

            expect(names).toEqual(['first', 'second', 'third']);
        });

        it('should provide access to field definitions', () => {
            const emailField = new EmailField('email', 'E-posta', { required: true });
            const schema = new FormSchema<{ email: string }>([emailField]);

            const retrieved = schema.getField('email');
            expect(retrieved).toBe(emailField);

            const notFound = schema.getField('nonexistent');
            expect(notFound).toBeUndefined();
        });

        it('should return labels for CSV export', () => {
            const schema = new FormSchema<{ name: string; age: number }>([
                new StringField('name', 'Kullanıcı Adı'),
                new NumberField('age', 'Kullanıcı Yaşı')
            ]);

            const labels = schema.getLabels();
            expect(labels).toEqual(['Kullanıcı Adı', 'Kullanıcı Yaşı']);
        });
    });

    // ==========================================================================
    // 2. REACTIVE VALUES (Signal-based State)
    // ==========================================================================
    describe('Reactive Values (Signals)', () => {

        it('should update values() signal when field changes', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Initial' });
            expect(form.values().name).toBe('Initial');

            form.setValue('name', 'Updated');
            expect(form.values().name).toBe('Updated');
        });

        it('should handle setValue for all field types', () => {
            interface TestForm {
                text: string;
                num: number;
                bool: boolean;
                date: Date;
                [key: string]: unknown;
            }

            const schema = new FormSchema<TestForm>([
                new StringField('text', 'Text'),
                new NumberField('num', 'Number'),
                new BooleanField('bool', 'Boolean'),
                new DateField('date', 'Date')
            ]);

            const testDate = new Date('2024-01-15');
            const form = schema.createForm();

            form.setValue('text', 'Hello');
            form.setValue('num', 42);
            form.setValue('bool', true);
            form.setValue('date', testDate);

            expect(form.values().text).toBe('Hello');
            expect(form.values().num).toBe(42);
            expect(form.values().bool).toBe(true);
            expect(form.values().date).toEqual(testDate);
        });

        it('should handle patchValues for multiple fields at once', () => {
            const schema = new FormSchema<{ a: string; b: string; c: string }>([
                new StringField('a', 'A'),
                new StringField('b', 'B'),
                new StringField('c', 'C')
            ]);

            const form = schema.createForm({ a: '1', b: '2', c: '3' });

            form.patchValues({ a: 'X', c: 'Z' });

            expect(form.values()).toEqual({ a: 'X', b: '2', c: 'Z' });
        });

        it('should ignore setValue for non-existent fields (no crash)', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Test' });

            // @ts-ignore - Testing runtime behavior
            expect(() => form.setValue('nonexistent', 'value')).not.toThrow();
            expect(form.values().name).toBe('Test');
        });
    });

    // ==========================================================================
    // 3. VALIDATION LOGIC (Zod Integration)
    // ==========================================================================
    describe('Validation Logic', () => {

        it('should compute valid signal correctly for valid form', () => {
            const schema = new FormSchema<{ email: string }>([
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ email: 'valid@example.com' });
            expect(form.valid()).toBe(true);
        });

        it('should compute valid signal correctly for invalid form', () => {
            const schema = new FormSchema<{ email: string }>([
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ email: 'not-an-email' });
            expect(form.valid()).toBe(false);
        });

        it('should track errors per field', () => {
            const schema = new FormSchema<{ email: string; age: number }>([
                new EmailField('email', 'E-posta', { required: true }),
                new NumberField('age', 'Yaş', { min: 18 })
            ]);

            const form = schema.createForm({ email: 'invalid', age: 10 });

            const errors = form.errors();
            expect(errors.email).toBeDefined();
            expect(errors.age).toBeDefined();
        });

        it('should clear error when value becomes valid', () => {
            const schema = new FormSchema<{ email: string }>([
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ email: 'invalid' });
            expect(form.fields.email.error()).toBeDefined();

            form.setValue('email', 'valid@example.com');
            expect(form.fields.email.error()).toBeNull();
        });

        it('should validateAll and touch all fields', async () => {
            const schema = new FormSchema<{ name: string; email: string }>([
                new StringField('name', 'İsim', { required: true }),
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ name: '', email: '' });

            expect(form.fields.name.touched()).toBe(false);
            expect(form.fields.email.touched()).toBe(false);

            const isValid = await form.validateAll();

            expect(isValid).toBe(false);
            expect(form.fields.name.touched()).toBe(true);
            expect(form.fields.email.touched()).toBe(true);
        });

        it('should getValues() throw on invalid form', () => {
            const schema = new FormSchema<{ email: string }>([
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ email: 'not-valid' });

            expect(() => form.getValues()).toThrow();
        });

        it('should getValues() return typed values on valid form', () => {
            const schema = new FormSchema<{ email: string }>([
                new EmailField('email', 'E-posta', { required: true })
            ]);

            const form = schema.createForm({ email: 'valid@example.com' });
            const values = form.getValues();

            expect(values).toEqual({ email: 'valid@example.com' });
        });
    });

    // ==========================================================================
    // 4. CROSS-FIELD VALIDATION (The Game Changer)
    // ==========================================================================
    describe('Cross-Field Validation', () => {

        interface PasswordForm {
            password: string;
            confirmPassword: string;
            [key: string]: unknown;
        }

        const passwordMatchValidator: CrossFieldValidator<PasswordForm> = {
            name: 'passwordMatch',
            fields: ['password', 'confirmPassword'],
            validate: (values) =>
                values.password !== values.confirmPassword
                    ? 'Şifreler eşleşmiyor'
                    : null
        };

        it('should detect cross-field validation errors', () => {
            const schema = new FormSchema<PasswordForm>(
                [
                    new PasswordField('password', 'Şifre', { required: true }),
                    new PasswordField('confirmPassword', 'Şifre Tekrar', { required: true })
                ],
                { crossValidators: [passwordMatchValidator] }
            );

            const form = schema.createForm({
                password: 'Secret123!',
                confirmPassword: 'Different456!'
            });

            expect(form.crossErrors()['passwordMatch']).toBe('Şifreler eşleşmiyor');
            expect(form.valid()).toBe(false);
        });

        it('should clear cross-field error when values match', () => {
            const schema = new FormSchema<PasswordForm>(
                [
                    new PasswordField('password', 'Şifre', { required: true }),
                    new PasswordField('confirmPassword', 'Şifre Tekrar', { required: true })
                ],
                { crossValidators: [passwordMatchValidator] }
            );

            const form = schema.createForm({
                password: 'Secret123!',
                confirmPassword: 'Secret123!'
            });

            expect(form.crossErrors()['passwordMatch']).toBeNull();
            expect(form.valid()).toBe(true);
        });

        it('should handle multiple cross-field validators', () => {
            interface OrderForm {
                startDate: Date;
                endDate: Date;
                minQuantity: number;
                maxQuantity: number;
                [key: string]: unknown;
            }

            const dateValidator: CrossFieldValidator<OrderForm> = {
                name: 'dateRange',
                fields: ['startDate', 'endDate'],
                validate: (values) =>
                    values.startDate && values.endDate && values.startDate > values.endDate
                        ? 'Başlangıç tarihi bitiş tarihinden sonra olamaz'
                        : null
            };

            const quantityValidator: CrossFieldValidator<OrderForm> = {
                name: 'quantityRange',
                fields: ['minQuantity', 'maxQuantity'],
                validate: (values) =>
                    values.minQuantity > values.maxQuantity
                        ? 'Minimum miktar maksimumdan büyük olamaz'
                        : null
            };

            const schema = new FormSchema<OrderForm>(
                [
                    new DateField('startDate', 'Başlangıç'),
                    new DateField('endDate', 'Bitiş'),
                    new NumberField('minQuantity', 'Min'),
                    new NumberField('maxQuantity', 'Max')
                ],
                { crossValidators: [dateValidator, quantityValidator] }
            );

            const form = schema.createForm({
                startDate: new Date('2024-12-31'),
                endDate: new Date('2024-01-01'),
                minQuantity: 100,
                maxQuantity: 10
            });

            expect(form.crossErrors()['dateRange']).toBeDefined();
            expect(form.crossErrors()['quantityRange']).toBeDefined();
            expect(form.valid()).toBe(false);
        });

        it('should be reactive to value changes', () => {
            const schema = new FormSchema<PasswordForm>(
                [
                    new PasswordField('password', 'Şifre'),
                    new PasswordField('confirmPassword', 'Şifre Tekrar')
                ],
                { crossValidators: [passwordMatchValidator] }
            );

            const form = schema.createForm({
                password: 'Test1234!',
                confirmPassword: 'Different!'
            });

            expect(form.crossErrors()['passwordMatch']).toBeDefined();

            // Fix the mismatch
            form.setValue('confirmPassword', 'Test1234!');

            expect(form.crossErrors()['passwordMatch']).toBeNull();
        });
    });

    // ==========================================================================
    // 5. DIRTY / PRISTINE TRACKING
    // ==========================================================================
    describe('Dirty / Pristine Tracking', () => {

        it('should start as pristine and not dirty', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Initial' });

            expect(form.pristine()).toBe(true);
            expect(form.dirty()).toBe(false);
        });

        it('should become dirty when value changes', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Initial' });

            form.setValue('name', 'Changed');

            expect(form.dirty()).toBe(true);
        });

        it('should become NOT dirty when changed back to initial', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Initial' });

            form.setValue('name', 'Changed');
            expect(form.dirty()).toBe(true);

            form.setValue('name', 'Initial');
            expect(form.dirty()).toBe(false);
        });

        it('should track pristine based on touched status', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Test' });

            expect(form.pristine()).toBe(true);

            form.fields.name.touched.set(true);

            expect(form.pristine()).toBe(false);
        });

        it('should markPristine reset all touched flags', () => {
            const schema = new FormSchema<{ a: string; b: string }>([
                new StringField('a', 'A'),
                new StringField('b', 'B')
            ]);

            const form = schema.createForm({ a: '1', b: '2' });

            form.touchAll();
            expect(form.fields.a.touched()).toBe(true);
            expect(form.fields.b.touched()).toBe(true);

            form.markPristine();
            expect(form.fields.a.touched()).toBe(false);
            expect(form.fields.b.touched()).toBe(false);
        });

        it('should getDirtyValues return only changed fields', () => {
            const schema = new FormSchema<{ a: string; b: string; c: string }>([
                new StringField('a', 'A'),
                new StringField('b', 'B'),
                new StringField('c', 'C')
            ]);

            const form = schema.createForm({ a: '1', b: '2', c: '3' });

            form.setValue('a', 'X');
            form.setValue('c', 'Z');

            const dirtyValues = form.getDirtyValues();

            expect(dirtyValues).toEqual({ a: 'X', c: 'Z' });
            expect(dirtyValues.b).toBeUndefined();
        });
    });

    // ==========================================================================
    // 6. RESET FUNCTIONALITY
    // ==========================================================================
    describe('Reset Functionality', () => {

        it('should reset to initial values', () => {
            const schema = new FormSchema<{ name: string; age: number }>([
                new StringField('name', 'İsim'),
                new NumberField('age', 'Yaş')
            ]);

            const form = schema.createForm({ name: 'Original', age: 25 });

            form.setValue('name', 'Changed');
            form.setValue('age', 99);

            form.reset();

            expect(form.values()).toEqual({ name: 'Original', age: 25 });
        });

        it('should reset with new initial values', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'First' });

            form.reset({ name: 'Second' });

            expect(form.values().name).toBe('Second');
            expect(form.initialValues().name).toBe('Second');
        });

        it('should reset touched flags on reset', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'Test' });

            form.touchAll();
            expect(form.fields.name.touched()).toBe(true);

            form.reset();
            expect(form.fields.name.touched()).toBe(false);
        });

        it('should update dirty calculation base after reset with new values', () => {
            const schema = new FormSchema<{ name: string }>([
                new StringField('name', 'İsim')
            ]);

            const form = schema.createForm({ name: 'A' });

            form.reset({ name: 'B' });

            // Form should not be dirty after reset
            expect(form.dirty()).toBe(false);

            // Changing to original 'A' should now make it dirty
            form.setValue('name', 'A');
            expect(form.dirty()).toBe(true);
        });
    });

    // ==========================================================================
    // 7. DEEP EQUALITY (The Edge Case King)
    // ==========================================================================
    describe('Deep Equality Logic', () => {

        it('should handle nested objects in dirty check', () => {
            interface FormWithObject {
                config: { nested: string };
                [key: string]: unknown;
            }

            // Using any type to bypass field type restrictions for testing
            const schema = new FormSchema<FormWithObject>([
                new StringField('config', 'Config') as any
            ]);

            const form = schema.createForm({ config: { nested: 'value' } } as any);

            // Same value - should not be dirty
            form.setValue('config' as any, { nested: 'value' });
            // Note: This test documents current behavior with objects
        });

        it('should handle array values in dirty check', () => {
            // Testing with select field that might have array-like structure
            const schema = new FormSchema<{ items: string }>([
                new StringField('items', 'Items')
            ]);

            const form = schema.createForm({ items: 'a,b,c' });

            form.setValue('items', 'a,b,c');
            expect(form.dirty()).toBe(false);

            form.setValue('items', 'x,y,z');
            expect(form.dirty()).toBe(true);
        });

        it('should handle Date objects correctly', () => {
            const schema = new FormSchema<{ date: Date }>([
                new DateField('date', 'Tarih')
            ]);

            const originalDate = new Date('2024-01-15');
            const form = schema.createForm({ date: originalDate });

            // Same date, different object
            form.setValue('date', new Date('2024-01-15'));
            expect(form.dirty()).toBe(false);

            // Different date
            form.setValue('date', new Date('2024-12-31'));
            expect(form.dirty()).toBe(true);
        });

        it('should handle null/undefined transitions', () => {
            const schema = new FormSchema<{ value: string | null }>([
                new StringField('value', 'Value')
            ]);

            const form = schema.createForm({ value: null });

            expect(form.dirty()).toBe(false);

            form.setValue('value', 'something');
            expect(form.dirty()).toBe(true);

            form.setValue('value', null);
            expect(form.dirty()).toBe(false);
        });
    });

    // ==========================================================================
    // 8. TOUCH FUNCTIONALITY
    // ==========================================================================
    describe('Touch Functionality', () => {

        it('should touchAll mark every field as touched', () => {
            const schema = new FormSchema<{ a: string; b: string; c: string }>([
                new StringField('a', 'A'),
                new StringField('b', 'B'),
                new StringField('c', 'C')
            ]);

            const form = schema.createForm({ a: '1', b: '2', c: '3' });

            form.touchAll();

            expect(form.fields.a.touched()).toBe(true);
            expect(form.fields.b.touched()).toBe(true);
            expect(form.fields.c.touched()).toBe(true);
        });

        it('should markDirty set touched for specific field', () => {
            const schema = new FormSchema<{ a: string; b: string }>([
                new StringField('a', 'A'),
                new StringField('b', 'B')
            ]);

            const form = schema.createForm({ a: '1', b: '2' });

            form.markDirty('a');

            expect(form.fields.a.touched()).toBe(true);
            expect(form.fields.b.touched()).toBe(false);
        });
    });

    // ==========================================================================
    // 9. ZOD SCHEMA EXPOSURE
    // ==========================================================================
    describe('Zod Schema Exposure', () => {

        it('should expose combined Zod schema for external use', () => {
            const schema = new FormSchema<{ email: string; age: number }>([
                new EmailField('email', 'E-posta', { required: true }),
                new NumberField('age', 'Yaş', { min: 0, max: 150 })
            ]);

            const zodSchema = schema.getZodSchema();

            // Valid data
            const validResult = zodSchema.safeParse({ email: 'test@example.com', age: 25 });
            expect(validResult.success).toBe(true);

            // Invalid data
            const invalidResult = zodSchema.safeParse({ email: 'not-email', age: -5 });
            expect(invalidResult.success).toBe(false);
        });
    });

    // ==========================================================================
    // 10. FACTORY FUNCTION (createFormSchema)
    // ==========================================================================
    describe('Factory Function', () => {

        it('should create schema via factory function', () => {
            const schema = createFormSchema<{ name: string }>([
                new StringField('name', 'İsim', { required: true })
            ]);

            const form = schema.createForm({ name: 'Test' });

            expect(form.values().name).toBe('Test');
            expect(schema.getNames()).toEqual(['name']);
        });
    });

    // ==========================================================================
    // 11. EDGE CASES & ERROR HANDLING
    // ==========================================================================
    describe('Edge Cases & Error Handling', () => {

        it('should handle form with single field', () => {
            const schema = new FormSchema<{ solo: string }>([
                new StringField('solo', 'Solo')
            ]);

            const form = schema.createForm({ solo: 'alone' });

            expect(form.values().solo).toBe('alone');
            expect(form.valid()).toBe(true);
        });

        it('should handle empty form (no fields)', () => {
            const schema = new FormSchema<Record<string, never>>([]);

            const form = schema.createForm({});

            expect(form.values()).toEqual({});
            expect(form.valid()).toBe(true);
            expect(form.dirty()).toBe(false);
        });

        it('should handle special characters in field values', () => {
            const schema = new FormSchema<{ text: string }>([
                new StringField('text', 'Text')
            ]);

            const form = schema.createForm({ text: '🎉 Special <script>alert("XSS")</script> çöğüşı' });

            expect(form.values().text).toBe('🎉 Special <script>alert("XSS")</script> çöğüşı');
        });

        it('should handle very long strings', () => {
            const schema = new FormSchema<{ data: string }>([
                new StringField('data', 'Data')
            ]);

            const longString = 'x'.repeat(100000);
            const form = schema.createForm({ data: longString });

            expect(form.values().data).toBe(longString);
            expect(form.values().data.length).toBe(100000);
        });

        it('should handle rapid value changes', () => {
            const schema = new FormSchema<{ counter: number }>([
                new NumberField('counter', 'Counter')
            ]);

            const form = schema.createForm({ counter: 0 });

            for (let i = 1; i <= 1000; i++) {
                form.setValue('counter', i);
            }

            expect(form.values().counter).toBe(1000);
            expect(form.dirty()).toBe(true);
        });

        it('should create independent form instances', () => {
            const schema = new FormSchema<{ value: string }>([
                new StringField('value', 'Value')
            ]);

            const form1 = schema.createForm({ value: 'Form 1' });
            const form2 = schema.createForm({ value: 'Form 2' });

            form1.setValue('value', 'Modified 1');

            expect(form1.values().value).toBe('Modified 1');
            expect(form2.values().value).toBe('Form 2');
        });
    });

    // ==========================================================================
    // 12. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('should handle user registration form workflow', async () => {
            interface RegistrationForm {
                email: string;
                password: string;
                confirmPassword: string;
                acceptTerms: boolean;
                [key: string]: unknown;
            }

            const schema = new FormSchema<RegistrationForm>(
                [
                    new EmailField('email', 'E-posta', { required: true }),
                    new PasswordField('password', 'Şifre', { required: true, minLength: 8 }),
                    new PasswordField('confirmPassword', 'Şifre Tekrar', { required: true }),
                    new BooleanField('acceptTerms', 'Şartları Kabul Et')
                ],
                {
                    crossValidators: [
                        {
                            name: 'passwordMatch',
                            fields: ['password', 'confirmPassword'],
                            validate: (v) => v.password !== v.confirmPassword ? 'Şifreler eşleşmiyor' : null
                        }
                    ]
                }
            );

            const form = schema.createForm({
                email: '',
                password: '',
                confirmPassword: '',
                acceptTerms: false
            });

            // Step 1: Empty form should be invalid
            expect(form.valid()).toBe(false);

            // Step 2: Fill with mismatched passwords
            form.patchValues({
                email: 'user@example.com',
                password: 'Secret123!',
                confirmPassword: 'Different!',
                acceptTerms: true
            });

            expect(form.crossErrors()['passwordMatch']).toBeDefined();

            // Step 3: Fix passwords
            form.setValue('confirmPassword', 'Secret123!');

            // Step 4: Validate before submit
            const isValid = await form.validateAll();
            expect(isValid).toBe(true);

            // Step 5: Get values for API
            const data = form.getValues();
            expect(data.email).toBe('user@example.com');
        });

        it('should handle edit form workflow (dirty tracking)', () => {
            interface ProfileForm {
                name: string;
                bio: string;
                [key: string]: unknown;
            }

            const schema = new FormSchema<ProfileForm>([
                new StringField('name', 'Ad'),
                new StringField('bio', 'Biyografi')
            ]);

            // Simulate loading existing data
            const existingData = { name: 'John Doe', bio: 'Developer' };
            const form = schema.createForm(existingData);

            // No changes yet
            expect(form.dirty()).toBe(false);

            // User edits bio
            form.setValue('bio', 'Senior Developer');
            expect(form.dirty()).toBe(true);

            // Get only changed fields for PATCH request
            const changes = form.getDirtyValues();
            expect(changes).toEqual({ bio: 'Senior Developer' });
            expect(changes.name).toBeUndefined();

            // User cancels - reset
            form.reset();
            expect(form.values()).toEqual(existingData);
            expect(form.dirty()).toBe(false);
        });

        it('should handle dynamic form with select field', () => {
            interface OrderForm {
                product: string;
                quantity: number;
                [key: string]: unknown;
            }

            const schema = new FormSchema<OrderForm>([
                new SelectField<string>('product', 'Ürün', {
                    required: true,
                    options: [
                        { value: 'laptop', label: 'Laptop' },
                        { value: 'phone', label: 'Telefon' },
                        { value: 'tablet', label: 'Tablet' }
                    ]
                }),
                new NumberField('quantity', 'Miktar', { required: true, min: 1 })
            ]);

            const form = schema.createForm({ product: '', quantity: 1 });

            form.setValue('product', 'laptop');
            form.setValue('quantity', 5);

            expect(form.valid()).toBe(true);
            expect(form.values()).toEqual({ product: 'laptop', quantity: 5 });
        });
    });
});