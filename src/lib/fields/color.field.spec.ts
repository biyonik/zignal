import { ColorField } from './color.field';

describe('ColorField Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Regex Boundaries)
    // --------------------------------------------------------------------------
    describe('Schema Validation & Regex Boundaries', () => {

        describe('HEX Format Validation', () => {
            const field = new ColorField('hex', 'Hex Color', { format: 'hex', required: true });
            const schema = field.schema();

            it('should validate standard HEX codes', () => {
                expect(schema.safeParse('#FF0000').success).toBe(true);
                expect(schema.safeParse('#ffffff').success).toBe(true);
                expect(schema.safeParse('#123456').success).toBe(true);
            });

            it('should validate shorthand HEX codes', () => {
                expect(schema.safeParse('#F00').success).toBe(true); // Red
                expect(schema.safeParse('#abc').success).toBe(true);
            });

            it('should FAIL on invalid HEX codes', () => {
                expect(schema.safeParse('FF0000').success).toBe(false); // Missing hash
                expect(schema.safeParse('#ZZZZZZ').success).toBe(false); // Invalid chars
                expect(schema.safeParse('#12345').success).toBe(false); // Invalid length
                expect(schema.safeParse('#').success).toBe(false); // Empty
            });

            it('should FAIL on Alpha HEX if alpha config is false', () => {
                // alpha: false (default)
                expect(schema.safeParse('#FF0000FF').success).toBe(false);
                expect(schema.safeParse('#F00F').success).toBe(false);
            });
        });

        describe('HEX with Alpha Support', () => {
            const field = new ColorField('hexAlpha', 'Alpha', { format: 'hex', alpha: true, required: true });
            const schema = field.schema();

            it('should accept 8-digit and 4-digit HEX codes', () => {
                expect(schema.safeParse('#FF000080').success).toBe(true); // 50% opacity
                expect(schema.safeParse('#F00A').success).toBe(true);     // Shorthand alpha
            });
        });

        describe('RGB Format Validation', () => {
            const field = new ColorField('rgb', 'RGB', { format: 'rgb', required: true });
            const schema = field.schema();

            it('should validate correct RGB syntax', () => {
                expect(schema.safeParse('rgb(255, 0, 0)').success).toBe(true);
                // Spaces tolerance (Regex check)
                expect(schema.safeParse('rgb( 255 , 0 , 0 )').success).toBe(true);
            });

            it('should FAIL on invalid RGB syntax', () => {
                expect(schema.safeParse('rgb(255,0)').success).toBe(false); // Missing channel
                expect(schema.safeParse('(255,0,0)').success).toBe(false); // Missing prefix
                expect(schema.safeParse('rgb(a,b,c)').success).toBe(false); // Letters
            });
        });

        describe('RGBA Support', () => {
            const field = new ColorField('rgba', 'RGBA', { format: 'rgb', alpha: true, required: true });
            const schema = field.schema();

            it('should validate RGBA syntax', () => {
                expect(schema.safeParse('rgba(255, 0, 0, 1)').success).toBe(true);
                expect(schema.safeParse('rgba(255, 0, 0, 0.5)').success).toBe(true);
                expect(schema.safeParse('rgba(255, 0, 0, .5)').success).toBe(true);
            });
        });

        describe('HSL Format Validation', () => {
            const field = new ColorField('hsl', 'HSL', { format: 'hsl', required: true });
            const schema = field.schema();

            it('should validate HSL syntax', () => {
                expect(schema.safeParse('hsl(360, 100%, 50%)').success).toBe(true);
            });

            it('should FAIL if percentages are missing', () => {
                // Regex expects % sign
                expect(schema.safeParse('hsl(360, 100, 50)').success).toBe(false);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. PRESET LOGIC (The "Trap" Test)
    // --------------------------------------------------------------------------
    describe('Preset Logic (allowCustom: false)', () => {
        const field = new ColorField('brand', 'Brand', {
            required: true,
            allowCustom: false,
            presets: ['#FF0000', '#00FF00'] // Red, Green
        });
        const schema = field.schema();

        it('should accept exact preset match', () => {
            expect(schema.safeParse('#FF0000').success).toBe(true);
        });

        it('should accept case-insensitive preset match', () => {
            // Config inputs are uppercase, testing lowercase input
            expect(schema.safeParse('#ff0000').success).toBe(true);
        });

        it('should REJECT valid colors that are NOT in presets', () => {
            // #0000FF valid bir renk ama presette yok
            const result = schema.safeParse('#0000FF');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('önceden tanımlı renklerden');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 3. CONVERSION LOGIC (Math & Parsing)
    // --------------------------------------------------------------------------
    describe('Conversion Logic (The Engine)', () => {
        const field = new ColorField('engine', 'Engine');

        describe('HEX Conversion', () => {
            it('should expand shorthand HEX to full RGB', () => {
                // #F00 -> R:255, G:0, B:0
                const hex = '#F00';
                const rgb = field.convert(hex, 'rgb');
                expect(rgb).toBe('rgb(255, 0, 0)');
            });

            it('should parse 6-digit HEX correctly', () => {
                const hex = '#00FF00';
                const rgb = field.convert(hex, 'rgb');
                expect(rgb).toBe('rgb(0, 255, 0)');
            });
        });

        describe('Cross-Format Conversion (Integration)', () => {
            it('should convert RGB to HEX', () => {
                const rgb = 'rgb(255, 255, 255)'; // White
                const hex = field.convert(rgb, 'hex');
                expect(hex).toBe('#ffffff'); // Implementation uses lowercase
            });

            it('should convert RGB to HSL', () => {
                // Red: rgb(255, 0, 0) -> hsl(0, 100%, 50%)
                const rgb = 'rgb(255, 0, 0)';
                const hsl = field.convert(rgb, 'hsl');
                expect(hsl).toBe('hsl(0, 100%, 50%)');
            });

            it('should convert HSL to HEX', () => {
                // Blue: hsl(240, 100%, 50%) -> #0000ff
                const hsl = 'hsl(240, 100%, 50%)';
                const hex = field.convert(hsl, 'hex');
                expect(hex).toBe('#0000ff');
            });
        });

        describe('Alpha Channel Persistence', () => {
            it('should preserve alpha when converting RGBA to HEX (8-digit)', () => {
                // 0.5 * 255 = 127.5 ~ 128 -> 80 in Hex
                const rgba = 'rgba(255, 0, 0, 0.5)';
                const hexAlpha = field.convert(rgba, 'hex');
                // Expect roughly #ff000080
                expect(hexAlpha).toBe('#ff000080');
            });

            it('should preserve alpha when converting HEX to HSLA', () => {
                const hexAlpha = '#00FF0080'; // Green 50%
                const hsla = field.convert(hexAlpha, 'hsl');
                // H:120, S:100%, L:50%, A:0.5 (approx)
                expect(hsla).toContain('hsla(120, 100%, 50%');
                // Alpha floating point precision check might be tricky, checking existence
                expect(hsla).toContain(', 0.5)'); // Or close to it
            });
        });
    });

    // --------------------------------------------------------------------------
    // 4. IMPORT LOGIC (Auto-Conversion Feature)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {

        it('should automatically convert imported RGB to configured HEX format', () => {
            // Field HEX olarak ayarlı
            const field = new ColorField('c', 'C', { format: 'hex' });

            // Importa RGB geliyor
            const imported = field.fromImport('rgb(0, 0, 0)');

            // Çıktı HEX olmalı
            expect(imported).toBe('#000000');
        });

        it('should automatically convert imported HEX to configured RGB format', () => {
            // Field RGB olarak ayarlı
            const field = new ColorField('c', 'C', { format: 'rgb' });

            const imported = field.fromImport('#FFFFFF');
            expect(imported).toBe('rgb(255, 255, 255)');
        });

        it('should return null for invalid color strings', () => {
            const field = new ColorField('c', 'C');
            expect(field.fromImport('not-a-color')).toBeNull();
            expect(field.fromImport('rgb(999,999)')).toBeNull(); // Missing channel
        });

        it('should trim whitespace before processing', () => {
            const field = new ColorField('c', 'C', { format: 'hex' });
            // Boşluklu input
            const imported = field.fromImport('  #FFFFFF  ');
            expect(imported).toBe('#ffffff');
        });
    });

    // --------------------------------------------------------------------------
    // 5. EXPORT LOGIC
    // --------------------------------------------------------------------------
    describe('Export Logic (toExport)', () => {
        it('should ALWAYS export as HEX (Upper Case) regardless of input format', () => {
            const field = new ColorField('ex', 'Ex', { format: 'rgb' }); // Field format rgb

            // Value rgb olsa bile export hex olmalı (toExport implementasyonuna göre)
            // Kod: return this.convert(value, 'hex')?.toUpperCase() ?? value;
            const rgbValue = 'rgb(0, 255, 0)';

            expect(field.toExport(rgbValue)).toBe('#00FF00');
        });

        it('should return null for null input', () => {
            const field = new ColorField('ex', 'Ex');
            expect(field.toExport(null)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 6. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new ColorField('p', 'P');

        it('should return Uppercase color string', () => {
            expect(field.present('#abc')).toBe('#ABC');
        });

        it('should return dash for null', () => {
            expect(field.present(null)).toBe('-');
        });
    });
});