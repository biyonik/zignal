import {
    isValidTCKN,
    tcknSchema,
    isValidVKN,
    vknSchema,
    isValidTurkishIBAN,
    turkishIbanSchema,
    isValidTurkishPhone,
    normalizeTurkishPhone,
    normalizedTurkishPhoneSchema,
    isValidTurkishPlate,
    turkishPlateSchema,
    isValidTurkishPostalCode,
    turkishPostalCodeSchema
} from './tr-validators';

describe('Turkey Specific Validators (The National Guard) Hard Core Tests', () => {

    // ===========================================================================
    // 1. TCKN VALIDATION (Algorithm & Checksum)
    // ===========================================================================
    describe('TCKN Validation (Mod 10 Algorithm)', () => {

        // Algoritmik olarak geçerli TCKN örnekleri
        const VALID_TCKN = '10000000146';
        const VALID_TCKN_2 = '56673392366'; // Random valid generated

        it('should validate mathematically correct TCKN', () => {
            expect(isValidTCKN(VALID_TCKN)).toBe(true);
            expect(isValidTCKN(VALID_TCKN_2)).toBe(true);
        });

        it('should reject length !== 11', () => {
            expect(isValidTCKN('1000000014')).toBe(false); // 10 hane
            expect(isValidTCKN('100000001466')).toBe(false); // 12 hane
        });

        it('should reject if starts with 0', () => {
            // Algoritma tutsa bile 0 ile başlayamaz
            // 00000000146 gibi bir senaryo
            expect(isValidTCKN('01000000146')).toBe(false);
        });

        it('should reject non-numeric characters', () => {
            expect(isValidTCKN('1000000014a')).toBe(false);
        });

        it('should reject invalid checksum (10th digit mismatch)', () => {
            // 10. hane yanlış (Algoritmayı bozalım)
            // VALID: 100000001 4 6
            // TEST:  100000001 5 6
            expect(isValidTCKN('10000000156')).toBe(false);
        });

        it('should reject invalid checksum (11th digit mismatch)', () => {
            // 11. hane yanlış
            // VALID: 100000001 4 6
            // TEST:  100000001 4 7
            expect(isValidTCKN('10000000147')).toBe(false);
        });

        it('should validate via Zod Schema', () => {
            const result = tcknSchema.safeParse(VALID_TCKN);
            expect(result.success).toBe(true);

            const fail = tcknSchema.safeParse('11111111111'); // Algoritmik olarak geçersiz
            expect(fail.success).toBe(false);
            if (!fail.success) {
                expect(fail.error.issues[0].message).toBe('Geçersiz TCKN');
            }
        });
    });

    // ===========================================================================
    // 2. VKN VALIDATION (Tax ID)
    // ===========================================================================
    describe('VKN Validation (Complex Mod Algorithm)', () => {

        // Algoritmik olarak geçerli VKN (Test verisi)
        // Bu algoritma karmaşık olduğu için bilinen bir valid değer kullanıyoruz.
        // Örn: 1234567890 (Genelde test verisi olarak kullanılır ama algoritmayı geçmeyebilir)
        // Bu yüzden mock bir validasyon mantığı yerine kodun matematiğini test ediyoruz.
        // 0010010010 -> Bu matematiksel olarak geçerli bir VKN örneğidir.
        const VALID_VKN = '0010010010';

        it('should validate mathematically correct VKN', () => {
            expect(isValidVKN(VALID_VKN)).toBe(true);
        });

        it('should reject incorrect length', () => {
            expect(isValidVKN('001001001')).toBe(false); // 9 digits
            expect(isValidVKN('00100100101')).toBe(false); // 11 digits
        });

        it('should reject non-numeric input', () => {
            expect(isValidVKN('001001001a')).toBe(false);
        });

        it('should reject invalid checksum', () => {
            // Son haneyi değiştiriyoruz
            expect(isValidVKN('0010010011')).toBe(false);
        });

        it('should work with Zod Schema', () => {
            expect(vknSchema.safeParse(VALID_VKN).success).toBe(true);
            expect(vknSchema.safeParse('123').success).toBe(false);
        });
    });

    // ===========================================================================
    // 3. IBAN VALIDATION (Mod 97 & BigInt Logic)
    // ===========================================================================
    describe('IBAN Validation (Mod 97 Chunking)', () => {

        // Valid TR IBAN örneği (Dokümandan veya hesaplanmış)
        const VALID_IBAN = 'TR330006100519786457841326';

        it('should validate correct TR IBAN', () => {
            expect(isValidTurkishIBAN(VALID_IBAN)).toBe(true);
        });

        it('should handle spaces gracefully (Zod Transform check)', () => {
            const spaced = 'TR33 0006 1005 1978 6457 8413 26';
            // Fonksiyon kendi içinde replace yapıyor mu?
            expect(isValidTurkishIBAN(spaced)).toBe(true);

            // Zod schema transform testi
            const result = turkishIbanSchema.safeParse(spaced);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(VALID_IBAN); // Cleaned output
            }
        });

        it('should reject Foreign IBANs', () => {
            // TR ile başlamayan
            const DE_IBAN = 'DE89370400440532013000'; // Length might vary but starts with DE
            expect(isValidTurkishIBAN(DE_IBAN)).toBe(false);
        });

        it('should reject Invalid Length', () => {
            // TR IBAN 26 karakter olmalı
            const short = 'TR33000610051978645784132'; // 25 chars
            expect(isValidTurkishIBAN(short)).toBe(false);
        });

        it('should reject Invalid Checksum (Mod 97 fail)', () => {
            // Son haneyi değiştirelim
            const invalid = VALID_IBAN.slice(0, -1) + '0'; // 6 -> 0
            expect(isValidTurkishIBAN(invalid)).toBe(false);
        });

        it('should handle lowercase input via Zod', () => {
            const lower = VALID_IBAN.toLowerCase();
            const result = turkishIbanSchema.safeParse(lower);
            expect(result.success).toBe(true);
        });
    });

    // ===========================================================================
    // 4. PHONE VALIDATION & NORMALIZATION
    // ===========================================================================
    describe('Phone Validation (Regex Patterns)', () => {

        it('should validate all supported formats', () => {
            expect(isValidTurkishPhone('5321234567')).toBe(true);      // 10 hane
            expect(isValidTurkishPhone('05321234567')).toBe(true);     // 11 hane
            expect(isValidTurkishPhone('905321234567')).toBe(true);    // 12 hane
            expect(isValidTurkishPhone('+905321234567')).toBe(true);   // 13 hane
        });

        it('should clean garbage characters before validation', () => {
            // Fonksiyon içinde: replace(/[\s\-\(\)]/g, '')
            expect(isValidTurkishPhone('(532) 123-4567')).toBe(true);
            expect(isValidTurkishPhone('+90 (532) 123 45 67')).toBe(true);
        });

        it('should reject invalid starts', () => {
            expect(isValidTurkishPhone('1321234567')).toBe(false); // 1 ile başlıyor (5 olmalı)
            expect(isValidTurkishPhone('01321234567')).toBe(false);
        });

        it('should reject invalid lengths', () => {
            expect(isValidTurkishPhone('532123')).toBe(false); // Too short
            expect(isValidTurkishPhone('53212345678')).toBe(false); // Too long (11 hane ama başında 0 yok)
        });

        describe('Normalization Logic', () => {
            const TARGET = '5321234567';

            it('should normalize all formats to 5XXXXXXXXX', () => {
                expect(normalizeTurkishPhone('05321234567')).toBe(TARGET);
                expect(normalizeTurkishPhone('+905321234567')).toBe(TARGET);
                expect(normalizeTurkishPhone('905321234567')).toBe(TARGET);
                expect(normalizeTurkishPhone('(0532) 123 45 67')).toBe(TARGET);
            });

            it('should return null for invalid numbers', () => {
                expect(normalizeTurkishPhone('12345')).toBeNull();
            });

            it('should handle Zod Normalized Schema', () => {
                const result = normalizedTurkishPhoneSchema.safeParse('+90 532 123 45 67');
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(TARGET); // Transformed value
                }
            });
        });
    });

    // ===========================================================================
    // 5. LICENSE PLATE VALIDATION (Format Rules)
    // ===========================================================================
    describe('License Plate Validation (Complex Regex)', () => {

        it('should validate standard formats', () => {
            expect(isValidTurkishPlate('34ABC123')).toBe(true);  // 3 harf 3 sayı
            expect(isValidTurkishPlate('06A1234')).toBe(true);   // 1 harf 4 sayı
            expect(isValidTurkishPlate('35AB123')).toBe(true);   // 2 harf 3 sayı
        });

        it('should handle formatting (Spaces & Case)', () => {
            // Fonksiyon içinde replace ve toUpperCase var
            expect(isValidTurkishPlate('34 abc 123')).toBe(true);
            expect(isValidTurkishPlate('  06 a 1234 ')).toBe(true);
        });

        it('should reject Invalid Province Codes', () => {
            expect(isValidTurkishPlate('00ABC123')).toBe(false); // 00 yok
            expect(isValidTurkishPlate('82ABC123')).toBe(false); // 82 yok (Mevcut kod regex: 01-81)
            // NOT: Gelecekte 82 olabilir ama kod şu an desteklemiyor, test kodu doğrulamalı.
        });

        it('should enforce Letter/Number Combo Rules', () => {
            // Kural: 1 harf -> 4 rakam
            expect(isValidTurkishPlate('34A123')).toBe(false); // 1 harf 3 rakam (FAIL)

            // Kural: 3 harf -> Max 3 rakam (Kod: numbers.length > 3 return false)
            expect(isValidTurkishPlate('34ABC1234')).toBe(false); // 3 harf 4 rakam (FAIL)
        });

        it('should reject invalid regex matches', () => {
            expect(isValidTurkishPlate('AABB123')).toBe(false); // İl kodu yok
            expect(isValidTurkishPlate('34123')).toBe(false);   // Harf yok
        });

        it('should validate via Zod and Transform', () => {
            const result = turkishPlateSchema.safeParse('34 abc 123');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('34ABC123'); // Cleaned
            }
        });
    });

    // ===========================================================================
    // 6. POSTAL CODE VALIDATION
    // ===========================================================================
    describe('Postal Code Validation', () => {

        it('should validate correct codes', () => {
            expect(isValidTurkishPostalCode('34000')).toBe(true); // Istanbul
            expect(isValidTurkishPostalCode('06100')).toBe(true); // Ankara
            expect(isValidTurkishPostalCode('81000')).toBe(true); // Duzce
        });

        it('should reject invalid formats', () => {
            expect(isValidTurkishPostalCode('3400')).toBe(false); // 4 digits
            expect(isValidTurkishPostalCode('340000')).toBe(false); // 6 digits
            expect(isValidTurkishPostalCode('34a00')).toBe(false); // Non-numeric
        });

        it('should reject invalid Province Prefix', () => {
            expect(isValidTurkishPostalCode('00123')).toBe(false); // Province 00
            expect(isValidTurkishPostalCode('82123')).toBe(false); // Province 82
            expect(isValidTurkishPostalCode('99123')).toBe(false); // Province 99
        });

        it('should validate via Zod', () => {
            const result = turkishPostalCodeSchema.safeParse('34000');
            expect(result.success).toBe(true);
        });
    });
});