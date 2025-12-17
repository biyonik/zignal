import { CrossValidators, CrossValidationRunner } from './cross-field-validators';

describe('CrossValidators (Cross-Field Validation System) Tests', () => {

    // =========================================================================
    // 1. FIELDS MATCH
    // =========================================================================
    describe('fieldsMatch', () => {
        interface TestForm {
            password: string;
            confirmPassword: string;
            [key: string]: unknown;
        }

        it('should pass when fields match', () => {
            const validator = CrossValidators.fieldsMatch<TestForm>(
                'password',
                'confirmPassword',
                'Şifreler eşleşmiyor'
            );

            const result = validator.validate({
                password: 'secret123',
                confirmPassword: 'secret123'
            });

            expect(result).toBeNull();
        });

        it('should fail when fields do not match', () => {
            const validator = CrossValidators.fieldsMatch<TestForm>(
                'password',
                'confirmPassword',
                'Şifreler eşleşmiyor'
            );

            const result = validator.validate({
                password: 'secret123',
                confirmPassword: 'different'
            });

            expect(result).toBe('Şifreler eşleşmiyor');
        });
    });

    // =========================================================================
    // 2. DATE RANGE
    // =========================================================================
    describe('dateRange', () => {
        interface DateForm {
            startDate: Date | string | null;
            endDate: Date | string | null;
            [key: string]: unknown;
        }

        it('should pass when start is before end', () => {
            const validator = CrossValidators.dateRange<DateForm>('startDate', 'endDate');

            const result = validator.validate({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31')
            });

            expect(result).toBeNull();
        });

        it('should fail when start is after end', () => {
            const validator = CrossValidators.dateRange<DateForm>('startDate', 'endDate');

            const result = validator.validate({
                startDate: new Date('2024-12-31'),
                endDate: new Date('2024-01-01')
            });

            expect(result).toBeTruthy();
        });

        it('should pass when dates are null', () => {
            const validator = CrossValidators.dateRange<DateForm>('startDate', 'endDate');

            const result = validator.validate({
                startDate: null,
                endDate: null
            });

            expect(result).toBeNull();
        });
    });

    // =========================================================================
    // 3. AT LEAST ONE
    // =========================================================================
    describe('atLeastOne', () => {
        interface ContactForm {
            phone: string;
            email: string;
            address: string;
            [key: string]: unknown;
        }

        it('should pass when at least one field is filled', () => {
            const validator = CrossValidators.atLeastOne<ContactForm>(
                ['phone', 'email'],
                'Telefon veya e-posta gerekli'
            );

            expect(validator.validate({ phone: '555', email: '', address: '' })).toBeNull();
            expect(validator.validate({ phone: '', email: 'a@b.com', address: '' })).toBeNull();
        });

        it('should fail when all fields are empty', () => {
            const validator = CrossValidators.atLeastOne<ContactForm>(
                ['phone', 'email'],
                'Telefon veya e-posta gerekli'
            );

            const result = validator.validate({ phone: '', email: '', address: '' });

            expect(result).toBe('Telefon veya e-posta gerekli');
        });
    });

    // =========================================================================
    // 4. REQUIRED IF
    // =========================================================================
    describe('requiredIf', () => {
        interface CompanyForm {
            isCompany: boolean;
            companyName: string;
            taxId: string;
            [key: string]: unknown;
        }

        it('should require field when condition is met', () => {
            const validator = CrossValidators.requiredIf<CompanyForm>(
                'isCompany',
                true,
                'companyName',
                'Şirket adı zorunlu'
            );

            const result = validator.validate({
                isCompany: true,
                companyName: '',
                taxId: ''
            });

            expect(result).toBe('Şirket adı zorunlu');
        });

        it('should not require field when condition is not met', () => {
            const validator = CrossValidators.requiredIf<CompanyForm>(
                'isCompany',
                true,
                'companyName',
                'Şirket adı zorunlu'
            );

            const result = validator.validate({
                isCompany: false,
                companyName: '',
                taxId: ''
            });

            expect(result).toBeNull();
        });
    });

    // =========================================================================
    // 5. SUM EQUALS
    // =========================================================================
    describe('sumEquals', () => {
        interface PercentageForm {
            percent1: number;
            percent2: number;
            percent3: number;
            [key: string]: unknown;
        }

        it('should pass when sum equals target', () => {
            const validator = CrossValidators.sumEquals<PercentageForm>(
                ['percent1', 'percent2', 'percent3'],
                100
            );

            const result = validator.validate({
                percent1: 50,
                percent2: 30,
                percent3: 20
            });

            expect(result).toBeNull();
        });

        it('should fail when sum does not equal target', () => {
            const validator = CrossValidators.sumEquals<PercentageForm>(
                ['percent1', 'percent2', 'percent3'],
                100,
                'Yüzdeler toplamı 100 olmalı'
            );

            const result = validator.validate({
                percent1: 50,
                percent2: 30,
                percent3: 10
            });

            expect(result).toBe('Yüzdeler toplamı 100 olmalı');
        });
    });

    // =========================================================================
    // 6. MUTUALLY EXCLUSIVE
    // =========================================================================
    describe('mutuallyExclusive', () => {
        interface PaymentForm {
            creditCard: string;
            bankTransfer: string;
            cash: boolean;
            [key: string]: unknown;
        }

        it('should pass when only one is filled', () => {
            const validator = CrossValidators.mutuallyExclusive<PaymentForm>(
                ['creditCard', 'bankTransfer'],
                'Sadece bir ödeme yöntemi seçin'
            );

            expect(validator.validate({ creditCard: '1234', bankTransfer: '', cash: false })).toBeNull();
        });

        it('should fail when multiple are filled', () => {
            const validator = CrossValidators.mutuallyExclusive<PaymentForm>(
                ['creditCard', 'bankTransfer'],
                'Sadece bir ödeme yöntemi seçin'
            );

            const result = validator.validate({
                creditCard: '1234',
                bankTransfer: 'TR123',
                cash: false
            });

            expect(result).toBe('Sadece bir ödeme yöntemi seçin');
        });
    });

    // =========================================================================
    // 7. ALL DIFFERENT
    // =========================================================================
    describe('allDifferent', () => {
        interface SecurityForm {
            question1: string;
            question2: string;
            question3: string;
            [key: string]: unknown;
        }

        it('should pass when all values are different', () => {
            const validator = CrossValidators.allDifferent<SecurityForm>(
                ['question1', 'question2', 'question3']
            );

            const result = validator.validate({
                question1: 'a',
                question2: 'b',
                question3: 'c'
            });

            expect(result).toBeNull();
        });

        it('should fail when values repeat', () => {
            const validator = CrossValidators.allDifferent<SecurityForm>(
                ['question1', 'question2', 'question3'],
                'Sorular farklı olmalı'
            );

            const result = validator.validate({
                question1: 'same',
                question2: 'same',
                question3: 'different'
            });

            expect(result).toBe('Sorular farklı olmalı');
        });
    });

    // =========================================================================
    // 8. CROSS VALIDATION RUNNER
    // =========================================================================
    describe('CrossValidationRunner', () => {
        interface RegistrationForm {
            password: string;
            confirmPassword: string;
            email: string;
            phone: string;
            [key: string]: unknown;
        }

        it('should run all validators', () => {
            const runner = new CrossValidationRunner<RegistrationForm>([
                CrossValidators.passwordMatch('password', 'confirmPassword'),
                CrossValidators.atLeastOne(['email', 'phone'], 'İletişim bilgisi gerekli')
            ]);

            const result = runner.validate({
                password: 'secret',
                confirmPassword: 'different',
                email: '',
                phone: ''
            });

            expect(result.valid).toBe(false);
            expect(Object.keys(result.errors).length).toBe(2);
        });

        it('should pass when all validators pass', () => {
            const runner = new CrossValidationRunner<RegistrationForm>([
                CrossValidators.passwordMatch('password', 'confirmPassword'),
                CrossValidators.atLeastOne(['email', 'phone'])
            ]);

            const result = runner.validate({
                password: 'secret',
                confirmPassword: 'secret',
                email: 'a@b.com',
                phone: ''
            });

            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors).length).toBe(0);
        });
    });

    // =========================================================================
    // 9. CUSTOM VALIDATOR
    // =========================================================================
    describe('custom', () => {
        interface AgeForm {
            birthYear: number;
            retirementYear: number;
            [key: string]: unknown;
        }

        it('should support custom validation logic', () => {
            const validator = CrossValidators.custom<AgeForm>(
                'retirementAge',
                ['birthYear', 'retirementYear'],
                (values) => {
                    const age = values.retirementYear - values.birthYear;
                    return age < 60 ? 'Emeklilik yaşı en az 60 olmalı' : null;
                }
            );

            expect(validator.validate({ birthYear: 1980, retirementYear: 2040 })).toBeNull();
            expect(validator.validate({ birthYear: 1990, retirementYear: 2030 }))
                .toBe('Emeklilik yaşı en az 60 olmalı');
        });
    });
});
