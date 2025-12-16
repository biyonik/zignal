import { z } from 'zod';

/**
 * @fileoverview
 * TR: Türkiye'ye özgü validasyon fonksiyonları ve Zod şemaları.
 * TCKN, VKN, IBAN, telefon numarası gibi Türkiye'ye özgü formatları doğrular.
 *
 * EN: Turkey-specific validation functions and Zod schemas.
 * Validates Turkey-specific formats like TCKN, VKN, IBAN, phone number.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: TCKN (T.C. Kimlik Numarası) Validasyonu
// EN: TCKN (Turkish ID Number) Validation
// =============================================================================

/**
 * TR: TCKN (T.C. Kimlik Numarası) algoritmasına göre doğrulama yapar.
 *
 * TCKN Kuralları:
 * - 11 haneli olmalıdır
 * - İlk hane 0 olamaz
 * - 10. hane = ((1,3,5,7,9. haneler toplamı * 7) - (2,4,6,8. haneler toplamı)) mod 10
 * - 11. hane = (1-10. haneler toplamı) mod 10
 *
 * EN: Validates according to TCKN (Turkish ID Number) algorithm.
 *
 * TCKN Rules:
 * - Must be 11 digits
 * - First digit cannot be 0
 * - 10th digit = ((sum of 1,3,5,7,9 digits * 7) - (sum of 2,4,6,8 digits)) mod 10
 * - 11th digit = (sum of 1-10 digits) mod 10
 *
 * @param tckn - TR: Doğrulanacak TCKN
 *               EN: TCKN to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTCKN('10000000146'); // true
 * isValidTCKN('12345678901'); // false
 * isValidTCKN('00000000000'); // false (ilk hane 0 olamaz)
 * ```
 */
export function isValidTCKN(tckn: string): boolean {
  // TR: Sadece rakamlardan oluşmalı ve 11 hane olmalı
  // EN: Must contain only digits and be 11 digits
  if (!/^\d{11}$/.test(tckn)) {
    return false;
  }

  // TR: İlk hane 0 olamaz
  // EN: First digit cannot be 0
  if (tckn[0] === '0') {
    return false;
  }

  const digits = tckn.split('').map(Number);

  // TR: 10. hane kontrolü
  // EN: 10th digit check
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = ((oddSum * 7) - evenSum) % 10;

  if (digit10 < 0) {
    // TR: Negatif mod sonucu için düzeltme
    // EN: Correction for negative mod result
    const correctedDigit10 = (digit10 + 10) % 10;
    if (correctedDigit10 !== digits[9]) {
      return false;
    }
  } else if (digit10 !== digits[9]) {
    return false;
  }

  // TR: 11. hane kontrolü
  // EN: 11th digit check
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sumFirst10 % 10;

  if (digit11 !== digits[10]) {
    return false;
  }

  return true;
}

/**
 * TR: TCKN için Zod şeması.
 *
 * EN: Zod schema for TCKN.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   tckn: tcknSchema
 * });
 *
 * schema.parse({ tckn: '10000000146' }); // OK
 * schema.parse({ tckn: '12345678901' }); // Error
 * ```
 */
export const tcknSchema = z
  .string()
  .length(11, 'TCKN 11 haneli olmalıdır')
  .regex(/^\d+$/, 'TCKN sadece rakam içermelidir')
  .refine(isValidTCKN, 'Geçersiz TCKN');

// =============================================================================
// TR: VKN (Vergi Kimlik Numarası) Validasyonu
// EN: VKN (Tax ID Number) Validation
// =============================================================================

/**
 * TR: VKN (Vergi Kimlik Numarası) algoritmasına göre doğrulama yapar.
 *
 * VKN Kuralları:
 * - 10 haneli olmalıdır
 * - Son hane kontrol rakamıdır
 * - Her hane için: (hane + (10-pozisyon)) mod 10
 * - Sonuçlar toplanır ve mod 10 alınarak kontrol rakamı bulunur
 *
 * EN: Validates according to VKN (Tax ID Number) algorithm.
 *
 * VKN Rules:
 * - Must be 10 digits
 * - Last digit is check digit
 * - For each digit: (digit + (10-position)) mod 10
 * - Results are summed and mod 10 gives check digit
 *
 * @param vkn - TR: Doğrulanacak VKN
 *              EN: VKN to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidVKN('1234567890'); // Depends on algorithm
 * isValidVKN('123456789');  // false (10 hane değil)
 * ```
 */
export function isValidVKN(vkn: string): boolean {
  // TR: Sadece rakamlardan oluşmalı ve 10 hane olmalı
  // EN: Must contain only digits and be 10 digits
  if (!/^\d{10}$/.test(vkn)) {
    return false;
  }

  const digits = vkn.split('').map(Number);
  let sum = 0;

  // TR: İlk 9 hane için hesaplama
  // EN: Calculation for first 9 digits
  for (let i = 0; i < 9; i++) {
    let tmp = (digits[i] + (10 - (i + 1))) % 10;
    if (tmp === 9) {
      tmp = 9;
    } else {
      tmp = (tmp * Math.pow(2, 10 - (i + 1))) % 9;
    }
    sum += tmp;
  }

  // TR: Kontrol rakamı hesaplama
  // EN: Check digit calculation
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[9];
}

/**
 * TR: VKN için Zod şeması.
 *
 * EN: Zod schema for VKN.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   vkn: vknSchema
 * });
 * ```
 */
export const vknSchema = z
  .string()
  .length(10, 'VKN 10 haneli olmalıdır')
  .regex(/^\d+$/, 'VKN sadece rakam içermelidir')
  .refine(isValidVKN, 'Geçersiz VKN');

// =============================================================================
// TR: IBAN Validasyonu
// EN: IBAN Validation
// =============================================================================

/**
 * TR: Türk IBAN formatını doğrular.
 *
 * Türk IBAN Formatı:
 * - TR + 2 kontrol hanesi + 5 hane banka kodu + 1 hane şube kodu rezerv + 16 hane hesap no
 * - Toplam 26 karakter
 * - Mod 97 algoritması ile doğrulanır
 *
 * EN: Validates Turkish IBAN format.
 *
 * Turkish IBAN Format:
 * - TR + 2 check digits + 5 digit bank code + 1 digit branch reserve + 16 digit account
 * - Total 26 characters
 * - Validated with Mod 97 algorithm
 *
 * @param iban - TR: Doğrulanacak IBAN
 *               EN: IBAN to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTurkishIBAN('TR330006100519786457841326'); // true or false based on checksum
 * isValidTurkishIBAN('DE89370400440532013000');     // false (Türk IBAN değil)
 * ```
 */
export function isValidTurkishIBAN(iban: string): boolean {
  // TR: Boşlukları temizle ve büyük harfe çevir
  // EN: Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // TR: Türk IBAN formatı kontrolü
  // EN: Turkish IBAN format check
  if (!/^TR\d{24}$/.test(cleanIban)) {
    return false;
  }

  // TR: IBAN'ı yeniden düzenle (ilk 4 karakteri sona al)
  // EN: Rearrange IBAN (move first 4 characters to end)
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

  // TR: Harfleri sayılara dönüştür (A=10, B=11, ..., Z=35)
  // EN: Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericIban = '';
  for (const char of rearranged) {
    if (/[A-Z]/.test(char)) {
      numericIban += (char.charCodeAt(0) - 55).toString();
    } else {
      numericIban += char;
    }
  }

  // TR: Mod 97 kontrolü
  // EN: Mod 97 check
  // TR: Büyük sayılar için parçalı hesaplama
  // EN: Chunked calculation for large numbers
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 7) {
    const chunk = remainder.toString() + numericIban.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

/**
 * TR: Türk IBAN için Zod şeması.
 *
 * EN: Zod schema for Turkish IBAN.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   iban: turkishIbanSchema
 * });
 * ```
 */
export const turkishIbanSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, '').toUpperCase())
  .refine((val) => /^TR\d{24}$/.test(val), 'Geçersiz Türk IBAN formatı')
  .refine(isValidTurkishIBAN, 'Geçersiz IBAN');

// =============================================================================
// TR: Telefon Numarası Validasyonu
// EN: Phone Number Validation
// =============================================================================

/**
 * TR: Türk telefon numarası formatını doğrular.
 *
 * Desteklenen formatlar:
 * - 5XXXXXXXXX (10 hane, başında 5)
 * - 05XXXXXXXXX (11 hane, başında 05)
 * - +905XXXXXXXXX (13 karakter, başında +90)
 * - 905XXXXXXXXX (12 hane, başında 90)
 *
 * EN: Validates Turkish phone number format.
 *
 * Supported formats:
 * - 5XXXXXXXXX (10 digits, starting with 5)
 * - 05XXXXXXXXX (11 digits, starting with 05)
 * - +905XXXXXXXXX (13 characters, starting with +90)
 * - 905XXXXXXXXX (12 digits, starting with 90)
 *
 * @param phone - TR: Doğrulanacak telefon numarası
 *                EN: Phone number to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTurkishPhone('5321234567');    // true
 * isValidTurkishPhone('05321234567');   // true
 * isValidTurkishPhone('+905321234567'); // true
 * isValidTurkishPhone('1234567890');    // false
 * ```
 */
export function isValidTurkishPhone(phone: string): boolean {
  // TR: Boşluk, tire ve parantezleri temizle
  // EN: Remove spaces, dashes and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // TR: Farklı formatları kontrol et
  // EN: Check different formats
  const patterns = [
    /^5\d{9}$/,        // 5XXXXXXXXX
    /^05\d{9}$/,       // 05XXXXXXXXX
    /^\+905\d{9}$/,    // +905XXXXXXXXX
    /^905\d{9}$/,      // 905XXXXXXXXX
  ];

  return patterns.some((pattern) => pattern.test(cleanPhone));
}

/**
 * TR: Türk telefon numarasını normalize eder.
 * Tüm formatları 5XXXXXXXXX formatına dönüştürür.
 *
 * EN: Normalizes Turkish phone number.
 * Converts all formats to 5XXXXXXXXX format.
 *
 * @param phone - TR: Normalize edilecek telefon numarası
 *                EN: Phone number to normalize
 * @returns TR: Normalize edilmiş numara veya null
 *          EN: Normalized number or null
 *
 * @example
 * ```typescript
 * normalizeTurkishPhone('+905321234567'); // '5321234567'
 * normalizeTurkishPhone('05321234567');   // '5321234567'
 * normalizeTurkishPhone('invalid');       // null
 * ```
 */
export function normalizeTurkishPhone(phone: string): string | null {
  if (!isValidTurkishPhone(phone)) {
    return null;
  }

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (cleanPhone.startsWith('+90')) {
    return cleanPhone.slice(3);
  }
  if (cleanPhone.startsWith('90')) {
    return cleanPhone.slice(2);
  }
  if (cleanPhone.startsWith('0')) {
    return cleanPhone.slice(1);
  }

  return cleanPhone;
}

/**
 * TR: Türk telefon numarası için Zod şeması.
 *
 * EN: Zod schema for Turkish phone number.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   phone: turkishPhoneSchema
 * });
 * ```
 */
export const turkishPhoneSchema = z
  .string()
  .refine(isValidTurkishPhone, 'Geçersiz telefon numarası');

/**
 * TR: Normalize edilmiş Türk telefon numarası için Zod şeması.
 * Girilen numarayı 5XXXXXXXXX formatına dönüştürür.
 *
 * EN: Zod schema for normalized Turkish phone number.
 * Transforms input to 5XXXXXXXXX format.
 */
export const normalizedTurkishPhoneSchema = z
  .string()
  .refine(isValidTurkishPhone, 'Geçersiz telefon numarası')
  .transform((val) => normalizeTurkishPhone(val)!);

// =============================================================================
// TR: Plaka (Araç Tescil) Validasyonu
// EN: License Plate (Vehicle Registration) Validation
// =============================================================================

/**
 * TR: Türk araç plakası formatını doğrular.
 *
 * Plaka formatı:
 * - İl kodu (01-81) + harf grubu (1-3 harf) + sayı grubu (2-4 rakam)
 * - Örnek: 34ABC1234, 06A1234, 35AB123
 *
 * EN: Validates Turkish vehicle license plate format.
 *
 * Plate format:
 * - Province code (01-81) + letter group (1-3 letters) + number group (2-4 digits)
 * - Example: 34ABC1234, 06A1234, 35AB123
 *
 * @param plate - TR: Doğrulanacak plaka
 *                EN: Plate to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTurkishPlate('34ABC1234'); // true
 * isValidTurkishPlate('06A1234');   // true
 * isValidTurkishPlate('99AB123');   // false (geçersiz il kodu)
 * ```
 */
export function isValidTurkishPlate(plate: string): boolean {
  // TR: Boşlukları temizle ve büyük harfe çevir
  // EN: Remove spaces and convert to uppercase
  const cleanPlate = plate.replace(/\s/g, '').toUpperCase();

  // TR: Plaka formatı regex'i
  // EN: Plate format regex
  const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])([A-Z]{1,3})(\d{2,4})$/;

  if (!plateRegex.test(cleanPlate)) {
    return false;
  }

  const match = cleanPlate.match(plateRegex);
  if (!match) {
    return false;
  }

  const letters = match[2];
  const numbers = match[3];

  // TR: Harf ve sayı kombinasyonu kuralları
  // EN: Letter and number combination rules
  // 1 harf → 4 rakam, 2 harf → 2-4 rakam, 3 harf → 2-3 rakam
  if (letters.length === 1 && numbers.length !== 4) {
    return false;
  }
  if (letters.length === 3 && numbers.length > 3) {
    return false;
  }

  return true;
}

/**
 * TR: Türk plakası için Zod şeması.
 *
 * EN: Zod schema for Turkish license plate.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   plate: turkishPlateSchema
 * });
 * ```
 */
export const turkishPlateSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, '').toUpperCase())
  .refine(isValidTurkishPlate, 'Geçersiz plaka formatı');

// =============================================================================
// TR: Posta Kodu Validasyonu
// EN: Postal Code Validation
// =============================================================================

/**
 * TR: Türk posta kodu formatını doğrular.
 *
 * Posta kodu formatı:
 * - 5 haneli sayı
 * - İlk 2 hane il kodunu temsil eder (01-81)
 *
 * EN: Validates Turkish postal code format.
 *
 * Postal code format:
 * - 5 digit number
 * - First 2 digits represent province code (01-81)
 *
 * @param postalCode - TR: Doğrulanacak posta kodu
 *                     EN: Postal code to validate
 * @returns TR: Geçerli ise true, değilse false
 *          EN: True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTurkishPostalCode('34000'); // true (İstanbul)
 * isValidTurkishPostalCode('06100'); // true (Ankara)
 * isValidTurkishPostalCode('99000'); // false (geçersiz il kodu)
 * ```
 */
export function isValidTurkishPostalCode(postalCode: string): boolean {
  // TR: 5 haneli sayı kontrolü
  // EN: 5 digit number check
  if (!/^\d{5}$/.test(postalCode)) {
    return false;
  }

  // TR: İl kodu kontrolü (01-81)
  // EN: Province code check (01-81)
  const provinceCode = parseInt(postalCode.slice(0, 2), 10);

  return provinceCode >= 1 && provinceCode <= 81;
}

/**
 * TR: Türk posta kodu için Zod şeması.
 *
 * EN: Zod schema for Turkish postal code.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   postalCode: turkishPostalCodeSchema
 * });
 * ```
 */
export const turkishPostalCodeSchema = z
  .string()
  .length(5, 'Posta kodu 5 haneli olmalıdır')
  .regex(/^\d+$/, 'Posta kodu sadece rakam içermelidir')
  .refine(isValidTurkishPostalCode, 'Geçersiz posta kodu');

// =============================================================================
// TR: Tüm TR validatorları export
// EN: Export all TR validators
// =============================================================================

/**
 * TR: Tüm Türkiye'ye özgü validatorların toplu exportu.
 *
 * EN: Bulk export of all Turkey-specific validators.
 */
export const TRValidators = {
  // TCKN
  isValidTCKN,
  tcknSchema,

  // VKN
  isValidVKN,
  vknSchema,

  // IBAN
  isValidTurkishIBAN,
  turkishIbanSchema,

  // Phone
  isValidTurkishPhone,
  normalizeTurkishPhone,
  turkishPhoneSchema,
  normalizedTurkishPhoneSchema,

  // Plate
  isValidTurkishPlate,
  turkishPlateSchema,

  // Postal Code
  isValidTurkishPostalCode,
  turkishPostalCodeSchema,
};
