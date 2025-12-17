import {
    AsyncValidator,
    createEmailValidator,
    createUsernameValidator,
    createUniquenessValidator,
} from './async-validator';

/**
 * TR: AsyncValidator için test suite'i.
 * EN: Test suite for AsyncValidator.
 */
describe('AsyncValidator (The API Guardian)', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ==========================================================================
    // 1. BASIC VALIDATION
    // ==========================================================================
    describe('Basic Validation', () => {

        it('should validate and return null for valid value', async () => {
            const validator = new AsyncValidator<string>(
                async () => null // Always valid
            );

            const result = await validator.validate('test');

            expect(result).toBeNull();
            expect(validator.status()).toBe('valid');
            expect(validator.error()).toBeNull();
            expect(validator.valid()).toBe(true);
            expect(validator.invalid()).toBe(false);
        });

        it('should validate and return error message for invalid value', async () => {
            const validator = new AsyncValidator<string>(
                async () => 'This value is invalid'
            );

            const result = await validator.validate('test');

            expect(result).toBe('This value is invalid');
            expect(validator.status()).toBe('invalid');
            expect(validator.error()).toBe('This value is invalid');
            expect(validator.valid()).toBe(false);
            expect(validator.invalid()).toBe(true);
        });

        it('should track last validated value', async () => {
            const validator = new AsyncValidator<string>(async () => null);

            await validator.validate('first');
            expect(validator.lastValidatedValue()).toBe('first');

            await validator.validate('second');
            expect(validator.lastValidatedValue()).toBe('second');
        });

        it('should handle async validation function', async () => {
            const validator = new AsyncValidator<string>(
                async (value) => {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return value === 'taken' ? 'Already taken' : null;
                }
            );

            const promise = validator.validate('taken');
            expect(validator.status()).toBe('pending');
            expect(validator.pending()).toBe(true);

            jest.advanceTimersByTime(100);
            const result = await promise;

            expect(result).toBe('Already taken');
            expect(validator.status()).toBe('invalid');
        });
    });

    // ==========================================================================
    // 2. DEBOUNCE
    // ==========================================================================
    describe('Debounce', () => {

        it('should debounce validation calls', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { debounce: 300 });

            // Rapid calls
            validator.validateDebounced('a');
            validator.validateDebounced('ab');
            validator.validateDebounced('abc');

            // Mock function should not be called yet
            expect(mockFn).not.toHaveBeenCalled();

            // Wait for debounce
            jest.advanceTimersByTime(300);
            await Promise.resolve(); // Flush promises

            // Only last value should be validated
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
        });

        it('should use custom debounce time', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { debounce: 500 });

            validator.validateDebounced('test');

            jest.advanceTimersByTime(300);
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(200);
            await Promise.resolve();

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should show pending status during debounce', () => {
            const validator = new AsyncValidator<string>(
                async () => null,
                { debounce: 300 }
            );

            validator.validateDebounced('test');

            expect(validator.status()).toBe('pending');
            expect(validator.pending()).toBe(true);
        });
    });

    // ==========================================================================
    // 3. CACHING
    // ==========================================================================
    describe('Caching', () => {

        it('should cache validation results', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { cache: true });

            // First call
            await validator.validate('test');
            expect(mockFn).toHaveBeenCalledTimes(1);

            // Second call with same value (should use cache)
            await validator.validate('test');
            expect(mockFn).toHaveBeenCalledTimes(1);

            // Different value
            await validator.validate('other');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it('should not cache when disabled', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { cache: false });

            await validator.validate('test');
            await validator.validate('test');

            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it('should respect cache size limit (LRU)', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, {
                cache: true,
                cacheSize: 3
            });

            await validator.validate('a');
            await validator.validate('b');
            await validator.validate('c');
            expect(validator.getCacheSize()).toBe(3);

            // Adding 'd' should evict 'a'
            await validator.validate('d');
            expect(validator.getCacheSize()).toBe(3);

            // 'a' should not be in cache anymore
            mockFn.mockClear();
            await validator.validate('a');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should clear cache on clearCache()', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { cache: true });

            await validator.validate('test');
            expect(validator.getCacheSize()).toBe(1);

            validator.clearCache();
            expect(validator.getCacheSize()).toBe(0);

            await validator.validate('test');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    // ==========================================================================
    // 4. ABORT CONTROLLER
    // ==========================================================================
    describe('Abort Controller', () => {

        it('should abort previous request when new one starts', async () => {
            let abortedCount = 0;

            const validator = new AsyncValidator<string>(
                async (_value, signal) => {
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => resolve(null), 500);
                        signal?.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            abortedCount++;
                            reject(new DOMException('Aborted', 'AbortError'));
                        });
                    });
                },
                { cache: false }
            );

            // Start first validation
            const promise1 = validator.validate('first');

            // Start second validation (should abort first)
            jest.advanceTimersByTime(100);
            const promise2 = validator.validate('second');

            jest.advanceTimersByTime(500);

            await Promise.allSettled([promise1, promise2]);

            expect(abortedCount).toBe(1);
        });

        it('should pass AbortSignal to validator function', async () => {
            let receivedSignal: AbortSignal | undefined;

            const validator = new AsyncValidator<string>(
                async (_, signal) => {
                    receivedSignal = signal;
                    return null;
                }
            );

            await validator.validate('test');

            expect(receivedSignal).toBeDefined();
            expect(receivedSignal).toBeInstanceOf(AbortSignal);
        });
    });

    // ==========================================================================
    // 5. MINIMUM LENGTH
    // ==========================================================================
    describe('Minimum Length', () => {

        it('should skip validation for values shorter than minLength', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { minLength: 3 });

            await validator.validate('ab');

            expect(mockFn).not.toHaveBeenCalled();
            expect(validator.status()).toBe('idle');
        });

        it('should validate values at or above minLength', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { minLength: 3 });

            await validator.validate('abc');

            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });

    // ==========================================================================
    // 6. EMPTY VALUE HANDLING
    // ==========================================================================
    describe('Empty Value Handling', () => {

        it('should skip validation for empty string by default', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn);

            await validator.validate('');

            expect(mockFn).not.toHaveBeenCalled();
            expect(validator.status()).toBe('idle');
        });

        it('should validate empty when validateEmpty is true', async () => {
            const mockFn = jest.fn().mockResolvedValue('Cannot be empty');
            const validator = new AsyncValidator<string>(mockFn, { validateEmpty: true });

            await validator.validate('');

            expect(mockFn).toHaveBeenCalled();
            expect(validator.error()).toBe('Cannot be empty');
        });

        it('should skip validation for null/undefined by default', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string | null>(mockFn);

            await validator.validate(null);

            expect(mockFn).not.toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // 7. RESET
    // ==========================================================================
    describe('Reset', () => {

        it('should reset all state', async () => {
            const validator = new AsyncValidator<string>(async () => 'Error');

            await validator.validate('test');
            expect(validator.status()).toBe('invalid');
            expect(validator.error()).toBe('Error');

            validator.reset();

            expect(validator.status()).toBe('idle');
            expect(validator.error()).toBeNull();
            expect(validator.lastValidatedValue()).toBeNull();
        });

        it('should clear debounce timer on reset', async () => {
            const mockFn = jest.fn().mockResolvedValue(null);
            const validator = new AsyncValidator<string>(mockFn, { debounce: 300 });

            validator.validateDebounced('test');
            validator.reset();

            jest.advanceTimersByTime(300);

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('should abort pending request on reset', async () => {
            let wasAborted = false;

            const validator = new AsyncValidator<string>(
                async (_, signal) => {
                    return new Promise((resolve, reject) => {
                        signal?.addEventListener('abort', () => {
                            wasAborted = true;
                            reject(new DOMException('Aborted', 'AbortError'));
                        });
                        setTimeout(() => resolve(null), 500);
                    });
                }
            );

            validator.validate('test');
            validator.reset();

            expect(wasAborted).toBe(true);
        });
    });

    // ==========================================================================
    // 8. ERROR HANDLING
    // ==========================================================================
    describe('Error Handling', () => {

        it('should handle validator function throwing error', async () => {
            const validator = new AsyncValidator<string>(
                async () => {
                    throw new Error('Network error');
                }
            );

            const result = await validator.validate('test');

            expect(result).toBe('Network error');
            expect(validator.status()).toBe('invalid');
            expect(validator.error()).toBe('Network error');
        });

        it('should handle non-Error throws', async () => {
            const validator = new AsyncValidator<string>(
                async () => {
                    throw 'String error';
                }
            );

            const result = await validator.validate('test');

            expect(result).toBe('Doğrulama hatası');
        });

        it('should silently handle AbortError', async () => {
            const validator = new AsyncValidator<string>(
                async (_, signal) => {
                    return new Promise((resolve, reject) => {
                        signal?.addEventListener('abort', () => {
                            reject(new DOMException('Aborted', 'AbortError'));
                        });
                        setTimeout(() => resolve(null), 500);
                    });
                }
            );

            const promise = validator.validate('test');
            validator.reset(); // Triggers abort

            const result = await promise;

            // AbortError should return null silently
            expect(result).toBeNull();
        });
    });

    // ==========================================================================
    // 9. FACTORY FUNCTIONS
    // ==========================================================================
    describe('Factory Functions', () => {

        describe('createEmailValidator', () => {
            it('should create email validator with custom check function', async () => {
                const checkFn = jest.fn().mockResolvedValue(true); // exists = true
                const validator = createEmailValidator(checkFn);

                const result = await validator.validate('taken@example.com');

                expect(checkFn).toHaveBeenCalledWith('taken@example.com', expect.any(AbortSignal));
                expect(result).toBe('Bu email adresi zaten kullanılıyor');
            });

            it('should return null for available email', async () => {
                const checkFn = jest.fn().mockResolvedValue(false); // exists = false
                const validator = createEmailValidator(checkFn);

                const result = await validator.validate('new@example.com');

                expect(result).toBeNull();
            });

            it('should use custom error message', async () => {
                const validator = createEmailValidator(
                    async () => true,
                    { errorMessage: 'Email taken!' }
                );

                const result = await validator.validate('test@example.com');

                expect(result).toBe('Email taken!');
            });

            it('should have default minLength of 5', async () => {
                const checkFn = jest.fn().mockResolvedValue(false);
                const validator = createEmailValidator(checkFn);

                await validator.validate('a@b');

                expect(checkFn).not.toHaveBeenCalled();
            });
        });

        describe('createUsernameValidator', () => {
            it('should create username validator with custom check function', async () => {
                const checkFn = jest.fn().mockResolvedValue(false); // available = false
                const validator = createUsernameValidator(checkFn);

                const result = await validator.validate('taken_user');

                expect(result).toBe('Bu kullanıcı adı zaten alınmış');
            });

            it('should return null for available username', async () => {
                const checkFn = jest.fn().mockResolvedValue(true); // available = true
                const validator = createUsernameValidator(checkFn);

                const result = await validator.validate('new_user');

                expect(result).toBeNull();
            });

            it('should have default minLength of 3', async () => {
                const checkFn = jest.fn().mockResolvedValue(true);
                const validator = createUsernameValidator(checkFn);

                await validator.validate('ab');

                expect(checkFn).not.toHaveBeenCalled();
            });
        });

        describe('createUniquenessValidator', () => {
            it('should create generic uniqueness validator', async () => {
                const validator = createUniquenessValidator<string>(
                    async (value) => value !== 'taken',
                    'Value already exists'
                );

                expect(await validator.validate('taken')).toBe('Value already exists');
                expect(await validator.validate('new')).toBeNull();
            });

            it('should work with non-string types', async () => {
                const validator = createUniquenessValidator<number>(
                    async (id) => id !== 123,
                    'ID already exists'
                );

                expect(await validator.validate(123)).toBe('ID already exists');
                expect(await validator.validate(456)).toBeNull();
            });
        });
    });

    // ==========================================================================
    // 10. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('Scenario: User registration form', async () => {
            // Simulated API
            const takenEmails = ['admin@example.com', 'test@example.com'];
            const takenUsernames = ['admin', 'root', 'test'];

            const emailValidator = createEmailValidator(
                async (email) => takenEmails.includes(email)
            );

            const usernameValidator = createUsernameValidator(
                async (username) => !takenUsernames.includes(username)
            );

            // Check taken values
            expect(await emailValidator.validate('admin@example.com'))
                .toBe('Bu email adresi zaten kullanılıyor');
            expect(await usernameValidator.validate('admin'))
                .toBe('Bu kullanıcı adı zaten alınmış');

            // Check available values
            expect(await emailValidator.validate('new@example.com')).toBeNull();
            expect(await usernameValidator.validate('newuser')).toBeNull();
        });

        it('Scenario: Live search with debounce', async () => {
            const searchResults: string[] = [];
            const mockSearch = jest.fn().mockImplementation(async (query: string) => {
                searchResults.push(query);
                return null;
            });

            const validator = new AsyncValidator<string>(mockSearch, {
                debounce: 300,
                minLength: 2
            });

            // Simulating user typing "angular"
            validator.validateDebounced('a');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('an');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('ang');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('angu');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('angul');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('angula');
            jest.advanceTimersByTime(100);

            validator.validateDebounced('angular');

            // Wait for final debounce
            jest.advanceTimersByTime(300);
            await Promise.resolve();

            // Only final value should be searched
            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(searchResults).toEqual(['angular']);
        });

        it('Scenario: Coupon code validation', async () => {
            const validCoupons = ['SAVE10', 'WELCOME', 'VIP2024'];

            const couponValidator = new AsyncValidator<string>(
                async (code) => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return validCoupons.includes(code.toUpperCase())
                        ? null
                        : 'Geçersiz kupon kodu';
                },
                { cache: true }
            );

            // Valid coupon
            const promise1 = couponValidator.validate('SAVE10');
            expect(couponValidator.pending()).toBe(true);

            jest.advanceTimersByTime(100);
            expect(await promise1).toBeNull();

            // Invalid coupon
            const promise2 = couponValidator.validate('INVALID');
            jest.advanceTimersByTime(100);
            expect(await promise2).toBe('Geçersiz kupon kodu');

            // Cache hit - no new API call
            await couponValidator.validate('SAVE10');
            expect(couponValidator.getCacheSize()).toBe(2);
        });
    });
});