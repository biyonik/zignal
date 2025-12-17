import { SelectField, SelectOption } from './select.field';

// Mock Data Enum
enum UserRole {
    Admin = 1,
    Editor = 2,
    Viewer = 3
}

describe('SelectField (The Dropdown Master) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Constraints)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        const OPTIONS: SelectOption<string>[] = [
            { value: 'tr', label: 'Turkey' },
            { value: 'us', label: 'USA' },
            { value: 'kp', label: 'North Korea', disabled: true } // Yasaklı seçim
        ];

        const field = new SelectField('country', 'Country', {
            options: OPTIONS,
            required: true
        });
        const schema = field.schema();

        it('should accept valid, enabled options', () => {
            expect(schema.safeParse('tr').success).toBe(true);
            expect(schema.safeParse('us').success).toBe(true);
        });

        it('should reject values NOT in the options list (Hacker check)', () => {
            // Listede olmayan bir değer elle gönderilirse
            const result = schema.safeParse('de'); // Germany listede yok
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Geçersiz seçenek');
            }
        });

        it('should reject DISABLED options (The Trap)', () => {
            // North Korea disabled, seçilememeli!
            const result = schema.safeParse('kp');
            expect(result.success).toBe(false);
            if (!result.success) {
                // Disabled olduğu için validValues listesine hiç girmedi,
                // bu yüzden "Geçersiz seçenek" hatası almalı.
                expect(result.error.issues[0].message).toBe('Geçersiz seçenek');
            }
        });

        it('should handle Type Coercion strictly', () => {
            // String bekliyoruz, number gelirse patlamalı (veya fail etmeli)
            // Zod custom validation tip kontrolü yapmazsa TS runtime'da geçer,
            // ama validValues.includes(123) false döneceği için fail eder.
            expect(schema.safeParse(123).success).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // 2. TYPE GENERICS (Enum & Number Support)
    // --------------------------------------------------------------------------
    describe('Generic Type Support (Enum & Number)', () => {

        it('should handle Numeric Enums correctly', () => {
            const field = new SelectField<UserRole>('role', 'Role', {
                options: [
                    { value: UserRole.Admin, label: 'Administrator' },
                    { value: UserRole.Editor, label: 'Editor' }
                ],
                required: true
            });
            const schema = field.schema();

            // Valid Enum Value
            expect(schema.safeParse(UserRole.Admin).success).toBe(true);
            expect(schema.safeParse(1).success).toBe(true); // Raw number equals Enum

            // Invalid Enum Value
            expect(schema.safeParse(UserRole.Viewer).success).toBe(false); // Viewer listede yok
            expect(schema.safeParse(99).success).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // 3. IMPORT LOGIC (The Smart Matcher)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {

        const OPTIONS: SelectOption<string>[] = [
            { value: 'opt1', label: 'Option One' },
            { value: 'opt2', label: 'Option Two' },
            // Ambiguity Case: Value ve Label çakışması
            { value: 'Conflict', label: 'Peace' },
            { value: 'War', label: 'Conflict' }
        ];

        const field = new SelectField('smart', 'Smart Import', { options: OPTIONS });

        it('should match by VALUE directly', () => {
            expect(field.fromImport('opt1')).toBe('opt1');
        });

        it('should match by LABEL (Reverse Lookup)', () => {
            // Label veriyoruz, Value dönmeli
            expect(field.fromImport('Option One')).toBe('opt1');
        });

        it('should match by LABEL Case-Insensitive', () => {
            // User: "option one" -> System: "opt1"
            expect(field.fromImport('option one')).toBe('opt1');
            expect(field.fromImport('OPTION TWO')).toBe('opt2');
        });

        it('should prioritize VALUE over LABEL on conflict', () => {
            // Value: 'Conflict' (Label: Peace)
            // Value: 'War'      (Label: Conflict)

            // 'Conflict' stringi geldiğinde, hem bir value hem de bir label ile eşleşiyor.
            // Kod: byValue önce çalışır.
            // Beklenen: 'Conflict' value'su dönmeli (yani Peace label'lı olan).

            expect(field.fromImport('Conflict')).toBe('Conflict');
        });

        it('should return null for no match', () => {
            expect(field.fromImport('NonExistent')).toBeNull();
        });

        it('should handle Number imports when T is string (No Coercion in find)', () => {
            // Typescript T=string dedi, ama import raw=123 geldi.
            // opt.value === raw (Strict equality) false verir.
            // Beklenen null.
            expect(field.fromImport(123)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new SelectField('p', 'P', {
            options: [
                { value: 'a', label: 'Alpha' },
                { value: 'b', label: 'Beta' }
            ]
        });

        it('should return Label for existing Value', () => {
            expect(field.present('a')).toBe('Alpha');
        });

        it('should return Value itself if Label not found (Fallback)', () => {
            // 'c' listede yok, 'c' dönmeli
            expect(field.present('c')).toBe('c');
        });

        it('should return dash for null/undefined', () => {
            expect(field.present(null)).toBe('-');
        });
    });

    // --------------------------------------------------------------------------
    // 5. GROUPING & HELPERS
    // --------------------------------------------------------------------------
    describe('Grouping & Helper Methods', () => {
        const field = new SelectField('group', 'Group', {
            options: [
                { value: 'ist', label: 'Istanbul', group: 'Marmara' },
                { value: 'ank', label: 'Ankara', group: 'Ic Anadolu' },
                { value: 'izm', label: 'Izmir', group: 'Ege' },
                { value: 'van', label: 'Van' } // No group
            ]
        });

        it('getGroupedOptions should organize correctly', () => {
            const groups = field.getGroupedOptions();

            // Map keys check
            expect(groups.has('Marmara')).toBe(true);
            expect(groups.has('Ic Anadolu')).toBe(true);
            expect(groups.has(undefined)).toBe(true); // Van

            // Content check
            expect(groups.get('Marmara')![0].value).toBe('ist');
            expect(groups.get(undefined)![0].value).toBe('van');
        });

        it('getActiveOptions should exclude disabled items', () => {
            const fieldDis = new SelectField('d', 'D', {
                options: [
                    { value: 1, label: '1' },
                    { value: 2, label: '2', disabled: true }
                ]
            });

            expect(fieldDis.getOptions().length).toBe(2);
            expect(fieldDis.getActiveOptions().length).toBe(1);
            expect(fieldDis.getActiveOptions()[0].value).toBe(1);
        });

        it('getOptionByValue should find correct option', () => {
            const opt = field.getOptionByValue('ank');
            expect(opt).toBeDefined();
            expect(opt?.label).toBe('Ankara');
        });
    });
});