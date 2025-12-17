import { FormPersistence, createFormPersistence, clearAllZignalPersistence } from './form-persistence';

/**
 * TR: FormPersistence için test suite'i.
 * EN: Test suite for FormPersistence.
 */
describe('FormPersistence (The Time Capsule)', () => {

    // TR: Her testten önce storage'ı temizle
    // EN: Clear storage before each test
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ==========================================================================
    // 1. BASIC CRUD OPERATIONS
    // ==========================================================================
    describe('Basic CRUD Operations', () => {
        interface TestForm {
            name: string;
            email: string;
            age: number;
            [key: string]: unknown;
        }

        const testData: TestForm = {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        };

        it('should save and load data correctly', () => {
            const persistence = new FormPersistence<TestForm>({ key: 'test-form' });

            persistence.save(testData);
            const loaded = persistence.load();

            expect(loaded).toEqual(testData);
        });

        it('should return null when no data exists', () => {
            const persistence = new FormPersistence<TestForm>({ key: 'nonexistent' });

            expect(persistence.load()).toBeNull();
        });

        it('should clear data correctly', () => {
            const persistence = new FormPersistence<TestForm>({ key: 'test-form' });

            persistence.save(testData);
            expect(persistence.exists()).toBe(true);

            persistence.clear();
            expect(persistence.exists()).toBe(false);
            expect(persistence.load()).toBeNull();
        });

        it('should check existence correctly', () => {
            const persistence = new FormPersistence<TestForm>({ key: 'test-form' });

            expect(persistence.exists()).toBe(false);
            persistence.save(testData);
            expect(persistence.exists()).toBe(true);
        });
    });

    // ==========================================================================
    // 2. STORAGE TYPE SELECTION
    // ==========================================================================
    describe('Storage Type Selection', () => {
        const testData = { value: 'test' };

        it('should use localStorage by default', () => {
            const persistence = new FormPersistence({ key: 'local-test' });
            persistence.save(testData);

            expect(localStorage.getItem('zignal_local-test')).not.toBeNull();
            expect(sessionStorage.getItem('zignal_local-test')).toBeNull();
        });

        it('should use sessionStorage when specified', () => {
            const persistence = new FormPersistence({
                key: 'session-test',
                storage: 'session'
            });
            persistence.save(testData);

            expect(sessionStorage.getItem('zignal_session-test')).not.toBeNull();
            expect(localStorage.getItem('zignal_session-test')).toBeNull();
        });
    });

    // ==========================================================================
    // 3. PREFIX/NAMESPACE
    // ==========================================================================
    describe('Prefix & Namespace', () => {
        it('should use default prefix "zignal_"', () => {
            const persistence = new FormPersistence({ key: 'form1' });
            persistence.save({ x: 1 });

            expect(localStorage.getItem('zignal_form1')).not.toBeNull();
        });

        it('should use custom prefix', () => {
            const persistence = new FormPersistence({
                key: 'form1',
                prefix: 'myapp_'
            });
            persistence.save({ x: 1 });

            expect(localStorage.getItem('myapp_form1')).not.toBeNull();
            expect(localStorage.getItem('zignal_form1')).toBeNull();
        });

        it('should handle empty prefix', () => {
            const persistence = new FormPersistence({
                key: 'form1',
                prefix: ''
            });
            persistence.save({ x: 1 });

            expect(localStorage.getItem('form1')).not.toBeNull();
        });
    });

    // ==========================================================================
    // 4. FIELD FILTERING (Include/Exclude)
    // ==========================================================================
    describe('Field Filtering', () => {
        interface SensitiveForm {
            username: string;
            password: string;
            email: string;
            rememberMe: boolean;
            [key: string]: unknown;
        }

        const fullData: SensitiveForm = {
            username: 'john',
            password: 'secret123',
            email: 'john@example.com',
            rememberMe: true
        };

        it('should exclude specified fields', () => {
            const persistence = new FormPersistence<SensitiveForm>({
                key: 'login-form',
                exclude: ['password']
            });

            persistence.save(fullData);
            const loaded = persistence.load();

            expect(loaded).toEqual({
                username: 'john',
                email: 'john@example.com',
                rememberMe: true
            });
            expect(loaded).not.toHaveProperty('password');
        });

        it('should exclude multiple fields', () => {
            const persistence = new FormPersistence<SensitiveForm>({
                key: 'login-form',
                exclude: ['password', 'email']
            });

            persistence.save(fullData);
            const loaded = persistence.load();

            expect(loaded).toEqual({
                username: 'john',
                rememberMe: true
            });
        });

        it('should only include specified fields', () => {
            const persistence = new FormPersistence<SensitiveForm>({
                key: 'login-form',
                include: ['username', 'rememberMe']
            });

            persistence.save(fullData);
            const loaded = persistence.load();

            expect(loaded).toEqual({
                username: 'john',
                rememberMe: true
            });
        });

        it('should apply both include and exclude (exclude wins)', () => {
            const persistence = new FormPersistence<SensitiveForm>({
                key: 'login-form',
                include: ['username', 'password'],
                exclude: ['password']
            });

            persistence.save(fullData);
            const loaded = persistence.load();

            expect(loaded).toEqual({ username: 'john' });
        });
    });

    // ==========================================================================
    // 5. EXPIRY (TTL)
    // ==========================================================================
    describe('Expiry (TTL)', () => {
        const testData = { name: 'test' };

        it('should return data before expiry', () => {
            const persistence = new FormPersistence({
                key: 'expiry-test',
                expiry: 60000 // 1 minute
            });

            persistence.save(testData);

            // TR: 30 saniye ilerle
            // EN: Advance 30 seconds
            jest.advanceTimersByTime(30000);

            expect(persistence.load()).toEqual(testData);
        });

        it('should return null after expiry', () => {
            const persistence = new FormPersistence({
                key: 'expiry-test',
                expiry: 60000 // 1 minute
            });

            persistence.save(testData);

            // TR: 61 saniye ilerle (expiry aşıldı)
            // EN: Advance 61 seconds (expiry exceeded)
            jest.advanceTimersByTime(61000);

            expect(persistence.load()).toBeNull();
        });

        it('should clear expired data from storage', () => {
            const persistence = new FormPersistence({
                key: 'expiry-test',
                expiry: 60000
            });

            persistence.save(testData);
            jest.advanceTimersByTime(61000);

            persistence.load(); // Triggers cleanup

            expect(persistence.exists()).toBe(false);
        });

        it('should not expire when expiry is null', () => {
            const persistence = new FormPersistence({
                key: 'no-expiry',
                expiry: null
            });

            persistence.save(testData);

            // TR: 1 yıl ilerle
            // EN: Advance 1 year
            jest.advanceTimersByTime(365 * 24 * 60 * 60 * 1000);

            expect(persistence.load()).toEqual(testData);
        });
    });

    // ==========================================================================
    // 6. DATA AGE
    // ==========================================================================
    describe('Data Age', () => {
        it('should return correct age', () => {
            const persistence = new FormPersistence({ key: 'age-test' });

            persistence.save({ x: 1 });

            // TR: 5 saniye ilerle
            // EN: Advance 5 seconds
            jest.advanceTimersByTime(5000);

            const age = persistence.getAge();
            expect(age).toBe(5000);
        });

        it('should return null when no data', () => {
            const persistence = new FormPersistence({ key: 'age-test' });

            expect(persistence.getAge()).toBeNull();
        });
    });

    // ==========================================================================
    // 7. DEBOUNCE
    // ==========================================================================
    describe('Debounce', () => {
        it('should debounce save operations', () => {
            const persistence = new FormPersistence({
                key: 'debounce-test',
                debounce: 300
            });

            // TR: Private method'a erişmek için type assertion
            // EN: Type assertion to access private method
            const saveSpy = jest.spyOn(persistence, 'save');
            const debouncedSave = (persistence as any).debouncedSave.bind(persistence);

            // TR: Hızlı ardışık çağrılar
            // EN: Rapid successive calls
            debouncedSave({ v: 1 });
            debouncedSave({ v: 2 });
            debouncedSave({ v: 3 });

            // TR: Henüz save çağrılmamış olmalı
            // EN: Save should not be called yet
            expect(saveSpy).not.toHaveBeenCalled();

            // TR: Debounce süresini geç
            // EN: Exceed debounce time
            jest.advanceTimersByTime(300);

            // TR: Sadece son değer kaydedilmeli
            // EN: Only last value should be saved
            expect(saveSpy).toHaveBeenCalledTimes(1);
            expect(saveSpy).toHaveBeenCalledWith({ v: 3 });
        });

        it('should save immediately when debounce is 0', () => {
            const persistence = new FormPersistence({
                key: 'no-debounce',
                debounce: 0
            });

            const saveSpy = jest.spyOn(persistence, 'save');
            const debouncedSave = (persistence as any).debouncedSave.bind(persistence);

            debouncedSave({ v: 1 });

            expect(saveSpy).toHaveBeenCalledTimes(1);
        });
    });

    // ==========================================================================
    // 8. ERROR HANDLING
    // ==========================================================================
    describe('Error Handling', () => {
        it('should handle corrupted JSON gracefully', () => {
            localStorage.setItem('zignal_corrupted', 'not valid json{{{');

            const persistence = new FormPersistence({ key: 'corrupted' });
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const loaded = persistence.load();

            expect(loaded).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle storage quota exceeded', () => {
            const persistence = new FormPersistence({ key: 'quota-test' });

            // TR: localStorage.setItem'ı hata fırlatacak şekilde mock'la
            // EN: Mock localStorage.setItem to throw error
            const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
                .mockImplementation(() => {
                    throw new Error('QuotaExceededError');
                });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // TR: Hata fırlatmamalı, sadece warn loglamalı
            // EN: Should not throw, just log warn
            expect(() => persistence.save({ x: 1 })).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();

            setItemSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    // ==========================================================================
    // 9. FACTORY FUNCTION
    // ==========================================================================
    describe('createFormPersistence Factory', () => {
        it('should create persistence with key and options', () => {
            const persistence = createFormPersistence<{ name: string }>('factory-test', {
                storage: 'session',
                expiry: 5000
            });

            persistence.save({ name: 'test' });

            expect(sessionStorage.getItem('zignal_factory-test')).not.toBeNull();
        });

        it('should work with minimal config', () => {
            const persistence = createFormPersistence('minimal');
            persistence.save({ x: 1 });

            expect(persistence.load()).toEqual({ x: 1 });
        });
    });

    // ==========================================================================
    // 10. CLEAR ALL UTILITY
    // ==========================================================================
    describe('clearAllZignalPersistence Utility', () => {
        it('should clear all zignal prefixed items from localStorage', () => {
            localStorage.setItem('zignal_form1', '{}');
            localStorage.setItem('zignal_form2', '{}');
            localStorage.setItem('other_key', '{}');

            clearAllZignalPersistence('local');

            expect(localStorage.getItem('zignal_form1')).toBeNull();
            expect(localStorage.getItem('zignal_form2')).toBeNull();
            expect(localStorage.getItem('other_key')).not.toBeNull();
        });

        it('should clear all zignal prefixed items from sessionStorage', () => {
            sessionStorage.setItem('zignal_form1', '{}');
            sessionStorage.setItem('zignal_form2', '{}');

            clearAllZignalPersistence('session');

            expect(sessionStorage.getItem('zignal_form1')).toBeNull();
            expect(sessionStorage.getItem('zignal_form2')).toBeNull();
        });

        it('should use custom prefix', () => {
            localStorage.setItem('myapp_form1', '{}');
            localStorage.setItem('zignal_form1', '{}');

            clearAllZignalPersistence('local', 'myapp_');

            expect(localStorage.getItem('myapp_form1')).toBeNull();
            expect(localStorage.getItem('zignal_form1')).not.toBeNull();
        });
    });

    // ==========================================================================
    // 11. DESTROY / CLEANUP
    // ==========================================================================
    describe('Destroy & Cleanup', () => {
        it('should cleanup on destroy', () => {
            const persistence = new FormPersistence({
                key: 'destroy-test',
                debounce: 300
            });

            // TR: Debounced save başlat
            // EN: Start debounced save
            (persistence as any).debouncedSave({ x: 1 });

            // TR: Destroy çağır
            // EN: Call destroy
            persistence.destroy();

            // TR: Timer temizlenmeli, save çağrılmamalı
            // EN: Timer should be cleared, save should not be called
            jest.advanceTimersByTime(300);

            expect(persistence.load()).toBeNull();
        });
    });

    // ==========================================================================
    // 12. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('Scenario: Multi-step form with session persistence', () => {
            interface CheckoutForm {
                // Step 1
                email: string;
                // Step 2
                address: string;
                city: string;
                // Step 3
                cardNumber: string;
                cvv: string;
                [key: string]: unknown;
            }

            const persistence = new FormPersistence<CheckoutForm>({
                key: 'checkout',
                storage: 'session',
                exclude: ['cardNumber', 'cvv'], // PCI compliance
                expiry: 30 * 60 * 1000 // 30 minutes
            });

            // Step 1 complete
            persistence.save({
                email: 'customer@shop.com',
                address: '',
                city: '',
                cardNumber: '4111111111111111',
                cvv: '123'
            });

            // User refreshes page
            const restored = persistence.load();

            expect(restored).toEqual({
                email: 'customer@shop.com',
                address: '',
                city: ''
            });
            expect(restored).not.toHaveProperty('cardNumber');
            expect(restored).not.toHaveProperty('cvv');
        });

        it('Scenario: Draft auto-save with localStorage', () => {
            interface BlogPost {
                title: string;
                content: string;
                tags: string[];
                [key: string]: unknown;
            }

            const persistence = new FormPersistence<BlogPost>({
                key: 'blog-draft',
                storage: 'local',
                debounce: 1000,
                expiry: 7 * 24 * 60 * 60 * 1000 // 1 week
            });

            // User types
            const debouncedSave = (persistence as any).debouncedSave.bind(persistence);
            debouncedSave({ title: 'My Post', content: 'Draft...', tags: ['tech'] });

            // After debounce
            jest.advanceTimersByTime(1000);

            // User closes browser, comes back next day
            jest.advanceTimersByTime(24 * 60 * 60 * 1000);

            const draft = persistence.load();
            expect(draft).toEqual({
                title: 'My Post',
                content: 'Draft...',
                tags: ['tech']
            });
        });
    });
});