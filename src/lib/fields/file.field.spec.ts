import { FileField, FileInfo } from './file.field';

// --------------------------------------------------------------------------
// TEST DATA HELPERS
// --------------------------------------------------------------------------
const createMockFile = (name: string, size: number, type: string): FileInfo => ({
    name,
    size,
    type,
    lastModified: Date.now(),
    url: `http://localhost/${name}`
});

// 1MB Helper
const ONE_MB = 1024 * 1024;

describe('FileField Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. SIZE VALIDATION (Boundary Analysis)
    // --------------------------------------------------------------------------
    describe('Size Validation Logic', () => {

        describe('Max Size Constraints', () => {
            const field = new FileField('avatar', 'Avatar', {
                maxSize: 5 * ONE_MB, // 5MB
                required: true
            });
            const schema = field.schema();

            it('should accept files smaller than max size', () => {
                const file = createMockFile('small.png', 1 * ONE_MB, 'image/png');
                expect(schema.safeParse(file).success).toBe(true);
            });

            it('should accept files exactly at max size limit (Boundary)', () => {
                const file = createMockFile('limit.png', 5 * ONE_MB, 'image/png');
                expect(schema.safeParse(file).success).toBe(true);
            });

            it('should reject files larger than max size (Boundary + 1)', () => {
                // 5MB + 1 Byte
                const file = createMockFile('big.png', (5 * ONE_MB) + 1, 'image/png');
                const result = schema.safeParse(file);

                expect(result.success).toBe(false);
                if (!result.success) {
                    // "5 MB" stringinin hata mesajında geçtiğini doğrula
                    expect(result.error.issues[0].message).toContain('5 MB');
                }
            });
        });

        describe('Min Size Constraints', () => {
            const field = new FileField('doc', 'Doc', {
                minSize: 1024, // 1 KB
                required: true
            });
            const schema = field.schema();

            it('should reject files smaller than min size', () => {
                const file = createMockFile('tiny.txt', 100, 'text/plain');
                expect(schema.safeParse(file).success).toBe(false);
            });

            it('should accept files exactly at min size', () => {
                const file = createMockFile('exact.txt', 1024, 'text/plain');
                expect(schema.safeParse(file).success).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. MIME TYPE & EXTENSION VALIDATION
    // --------------------------------------------------------------------------
    describe('Type Validation Logic', () => {

        describe('Exact MIME Type Matching', () => {
            const field = new FileField('pdf', 'PDF Only', {
                accept: ['application/pdf'],
                required: true
            });
            const schema = field.schema();

            it('should accept exact MIME match', () => {
                const file = createMockFile('doc.pdf', 1000, 'application/pdf');
                expect(schema.safeParse(file).success).toBe(true);
            });

            it('should reject different MIME types', () => {
                const file = createMockFile('img.png', 1000, 'image/png');
                expect(schema.safeParse(file).success).toBe(false);
            });
        });

        describe('Wildcard MIME Type Matching (The Wild One)', () => {
            const field = new FileField('img', 'Any Image', {
                accept: ['image/*'], // Wildcard check
                required: true
            });
            const schema = field.schema();

            it('should accept specific types matching wildcard', () => {
                expect(schema.safeParse(createMockFile('a.png', 100, 'image/png')).success).toBe(true);
                expect(schema.safeParse(createMockFile('b.jpg', 100, 'image/jpeg')).success).toBe(true);
                expect(schema.safeParse(createMockFile('c.gif', 100, 'image/gif')).success).toBe(true);
            });

            it('should reject types NOT matching wildcard', () => {
                const file = createMockFile('doc.pdf', 100, 'application/pdf');
                const result = schema.safeParse(file);
                expect(result.success).toBe(false);
            });
        });

        describe('Extension Validation (Case Insensitivity)', () => {
            const field = new FileField('excel', 'Excel', {
                extensions: ['.xls', '.xlsx'],
                required: true
            });
            const schema = field.schema();

            it('should accept exact extension match', () => {
                const file = createMockFile('data.xlsx', 100, 'application/octet-stream');
                expect(schema.safeParse(file).success).toBe(true);
            });

            it('should ignore case (Case Insensitive Check)', () => {
                // Config: .xls -> Input: .XLS
                const file = createMockFile('OLD.XLS', 100, 'application/octet-stream');
                expect(schema.safeParse(file).success).toBe(true);
            });

            it('should reject invalid extensions', () => {
                const file = createMockFile('data.csv', 100, 'text/csv');
                expect(schema.safeParse(file).success).toBe(false);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. MULTIPLE FILE LOGIC
    // --------------------------------------------------------------------------
    describe('Multiple File Handling', () => {

        describe('When multiple is TRUE', () => {
            const field = new FileField('gallery', 'Gallery', {
                multiple: true,
                maxFiles: 3,
                maxSize: 1 * ONE_MB,
                required: true
            });
            const schema = field.schema();

            it('should accept valid array of files', () => {
                const files = [
                    createMockFile('1.png', 500, 'image/png'),
                    createMockFile('2.png', 500, 'image/png')
                ];
                expect(schema.safeParse(files).success).toBe(true);
            });

            it('should reject if ANY file in array is invalid', () => {
                const files = [
                    createMockFile('valid.png', 500, 'image/png'),
                    createMockFile('INVALID_SIZE.png', 5 * ONE_MB, 'image/png') // Too big
                ];
                const result = schema.safeParse(files);
                expect(result.success).toBe(false);
                // Zod array validation should catch the item error
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('Dosya boyutu');
                }
            });

            it('should enforce maxFiles limit', () => {
                const files = [
                    createMockFile('1.png', 100, 'image/png'),
                    createMockFile('2.png', 100, 'image/png'),
                    createMockFile('3.png', 100, 'image/png'),
                    createMockFile('4.png', 100, 'image/png') // Limit 3
                ];
                const result = schema.safeParse(files);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('En fazla 3 dosya');
                }
            });
        });

        describe('When multiple is FALSE (Default)', () => {
            const field = new FileField('single', 'Single');
            const schema = field.schema();

            it('should reject Array input', () => {
                const files = [createMockFile('1.png', 100, 'image/png')];
                // Schema single object bekliyor, array değil
                expect(schema.safeParse(files).success).toBe(false);
            });

            it('should accept Single object input', () => {
                const file = createMockFile('1.png', 100, 'image/png');
                expect(schema.safeParse(file).success).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 4. IMPORT / EXPORT & DATA MARSHALLING
    // --------------------------------------------------------------------------
    describe('Import/Export Logic', () => {
        const field = new FileField('doc', 'Doc');
        const multiField = new FileField('docs', 'Docs', { multiple: true });

        describe('fromImport', () => {
            it('should validate shape of imported single object', () => {
                const validRaw = { name: 'test.pdf', size: 123, type: 'application/pdf' };
                const invalidRaw = { name: 'test.pdf' }; // Missing size/type

                expect(field.fromImport(validRaw)).toEqual(validRaw);
                expect(field.fromImport(invalidRaw)).toBeNull();
            });

            it('should handle Array input for multiple field', () => {
                const rawArray = [
                    { name: '1.pdf', size: 10, type: 'app/pdf' },
                    { name: '2.pdf', size: 20, type: 'app/pdf' }
                ];
                expect(multiField.fromImport(rawArray)).toHaveLength(2);
            });

            it('should filter out invalid items from array import', () => {
                const rawArray = [
                    { name: 'valid.pdf', size: 10, type: 'app/pdf' },
                    { name: 'broken.pdf' } // Invalid shape
                ];
                const result = multiField.fromImport(rawArray);
                // TypeScript dönüş tipi FileInfo | FileInfo[] | null olduğu için cast ediyoruz
                expect(result).toHaveLength(1);
                expect((result as FileInfo[])[0].name).toBe('valid.pdf');
            });

            it('should return null for null input', () => {
                expect(field.fromImport(null)).toBeNull();
            });
        });

        describe('toExport', () => {
            it('should clean up single file object', () => {
                const file = createMockFile('test.png', 100, 'image/png');
                // @ts-ignore: preview alanını manuel ekliyoruz test için
                file.preview = 'base64-string-that-should-be-removed-usually';

                // Kodun toExport mantığına göre: name, size, type, url dönüyor.
                // Preview genelde export edilmez ama implementation'da preview export edilmiyor gibi görünüyor koddan:
                // return { name, size, type, url };
                const exported = field.toExport(file) as any;

                expect(exported.name).toBe('test.png');
                expect(exported.url).toBeDefined();
                // Kodda preview export objesine dahil EDİLMEMİŞ, bu doğru mu kontrolü:
                expect(exported.preview).toBeUndefined();
            });

            it('should handle array export', () => {
                const files = [createMockFile('a.png', 1, 'img'), createMockFile('b.png', 1, 'img')];
                const exported = multiField.toExport(files);
                expect(Array.isArray(exported)).toBe(true);
                expect(exported).toHaveLength(2);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 5. HELPER UTILITIES
    // --------------------------------------------------------------------------
    describe('Helper Utilities', () => {
        const field = new FileField('util', 'Util');

        describe('formatSize()', () => {
            it('should format 0 Bytes', () => {
                expect(field.formatSize(0)).toBe('0 Bytes');
            });

            it('should format Bytes (<1KB)', () => {
                expect(field.formatSize(500)).toBe('500 Bytes');
            });

            it('should format KB', () => {
                expect(field.formatSize(1024)).toBe('1 KB');
                expect(field.formatSize(1536)).toBe('1.5 KB');
            });

            it('should format MB', () => {
                expect(field.formatSize(ONE_MB)).toBe('1 MB');
                expect(field.formatSize(2.5 * ONE_MB)).toBe('2.5 MB');
            });

            it('should format GB', () => {
                const ONE_GB = 1024 * 1024 * 1024;
                expect(field.formatSize(ONE_GB)).toBe('1 GB');
            });
        });

        describe('getFileIcon()', () => {
            it('should return correct icons for mime types', () => {
                expect(field.getFileIcon({ type: 'image/jpeg' } as FileInfo)).toBe('image');
                expect(field.getFileIcon({ type: 'application/pdf' } as FileInfo)).toBe('pdf');
                expect(field.getFileIcon({ type: 'application/vnd.ms-excel' } as FileInfo)).toBe('spreadsheet');
                expect(field.getFileIcon({ type: 'application/zip' } as FileInfo)).toBe('archive');
                expect(field.getFileIcon({ type: 'unknown/type' } as FileInfo)).toBe('file');
            });
        });

        describe('getAcceptAttribute()', () => {
            it('should combine mime types and extensions for HTML attribute', () => {
                const mixField = new FileField('mix', 'Mix', {
                    accept: ['image/*'],
                    extensions: ['.pdf']
                });
                expect(mixField.getAcceptAttribute()).toBe('image/*,.pdf');
            });
        });

        describe('present()', () => {
            it('should display file name for single file', () => {
                const file = createMockFile('my-photo.jpg', 100, 'img');
                expect(field.present(file)).toBe('my-photo.jpg');
            });

            it('should display count for multiple files', () => {
                const files = [createMockFile('a',1,'t'), createMockFile('b',1,'t')];
                expect(field.present(files)).toBe('2 dosya');
            });

            it('should return dash for null/empty', () => {
                expect(field.present(null)).toBe('-');
                expect(field.present([])).toBe('-');
            });
        });
    });
});