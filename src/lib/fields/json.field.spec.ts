import { z } from 'zod';
import { JsonField } from './json.field';

describe('JsonField (The Data Structure Architect) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Parsing)
    // --------------------------------------------------------------------------
    describe('Schema & Validation Logic', () => {

        describe('Default Schema (Generic Object)', () => {
            const field = new JsonField('meta', 'Metadata', { required: true });
            const schema = field.schema();

            it('should accept any valid object', () => {
                expect(schema.safeParse({ a: 1 }).success).toBe(true);
                expect(schema.safeParse({}).success).toBe(true);
            });

            it('should reject non-object types', () => {
                // z.record expects object
                expect(schema.safeParse('string').success).toBe(false);
                expect(schema.safeParse(123).success).toBe(false);
                expect(schema.safeParse(null).success).toBe(false); // required: true
            });
        });

        describe('Custom Schema (Strict Structure)', () => {
            const customSchema = z.object({
                id: z.number(),
                details: z.object({
                    active: z.boolean()
                })
            });

            const field = new JsonField('config', 'Config', { schema: customSchema });
            const schema = field.schema();

            it('should enforce custom structure', () => {
                const validData = { id: 1, details: { active: true } };
                expect(schema.safeParse(validData).success).toBe(true);
            });

            it('should reject invalid structure', () => {
                const invalidData = { id: 'not-number', details: {} };
                const result = schema.safeParse(invalidData);
                expect(result.success).toBe(false);
            });
        });

        describe('validateJson Helper', () => {
            const field = new JsonField('test', 'Test', {
                schema: z.object({ key: z.string() })
            });

            it('should return valid=true for correct data', () => {
                expect(field.validateJson({ key: 'val' })).toEqual({ valid: true });
            });

            it('should return valid=false with error message for bad data', () => {
                const result = field.validateJson({ key: 123 }); // Expects string
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. DATA MANIPULATION (Get/Set & Immutability)
    // --------------------------------------------------------------------------
    describe('Data Manipulation (Dot Notation & Immutability)', () => {
        const field = new JsonField('data', 'Data');

        describe('getValue (Safe Access)', () => {
            const data = {
                user: {
                    profile: {
                        name: 'John',
                        age: 30
                    },
                    tags: ['admin', 'editor']
                }
            };

            it('should retrieve deep values', () => {
                expect(field.getValue(data, 'user.profile.name')).toBe('John');
                expect(field.getValue(data, 'user.profile.age')).toBe(30);
            });

            it('should return undefined for non-existent paths', () => {
                expect(field.getValue(data, 'user.ghost')).toBeUndefined();
                expect(field.getValue(data, 'user.profile.ghost')).toBeUndefined();
            });

            it('should return undefined if path is broken mid-way', () => {
                // user.profile.name is string, cannot access 'user.profile.name.sub'
                expect(field.getValue(data, 'user.profile.name.sub')).toBeUndefined();
            });

            it('should handle null source object', () => {
                expect(field.getValue(null, 'any.path')).toBeUndefined();
            });
        });

        describe('setValue (Immutable Update)', () => {
            const initialData = {
                app: {
                    config: { theme: 'dark' }
                }
            };

            it('should update value deeply and return NEW object reference', () => {
                const updated = field.setValue(initialData, 'app.config.theme', 'light');

                // Değer değişti mi?
                expect(field.getValue(updated, 'app.config.theme')).toBe('light');

                // Immutability Check: Orijinal değişmemeli!
                expect(initialData.app.config.theme).toBe('dark');
                expect(updated).not.toBe(initialData); // Farklı referans
                expect(updated.app).not.toBe(initialData.app); // İç obje referansı da değişmeli (path üzerindeki)
            });

            it('should create nested structure if it does not exist', () => {
                const empty = {};
                const result = field.setValue(empty, 'a.b.c', 'value');

                expect(result).toEqual({ a: { b: { c: 'value' } } });
            });

            it('should overwrite primitive values with objects if needed', () => {
                // a: 1 (number) -> a.b: 2 (object)
                const data = { a: 1 };
                // setValue implementation: if (typeof current[key] !== 'object') current[key] = {}
                const result = field.setValue(data, 'a.b', 2);

                // Beklenen: { a: { b: 2 } }
                expect(result).toEqual({ a: { b: 2 } });
            });

            it('should handle null initial object', () => {
                const result = field.setValue(null, 'key', 'val');
                expect(result).toEqual({ key: 'val' });
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. IMPORT / EXPORT & PARSING SAFETY
    // --------------------------------------------------------------------------
    describe('Import/Export & Parsing Safety', () => {
        const field = new JsonField('io', 'IO');

        describe('fromImport', () => {
            it('should accept Object directly', () => {
                const obj = { k: 'v' };
                expect(field.fromImport(obj)).toBe(obj);
            });

            it('should parse valid JSON string', () => {
                const str = '{"k": "v"}';
                expect(field.fromImport(str)).toEqual({ k: 'v' });
            });

            it('should return null for Arrays (Strict Object Policy)', () => {
                expect(field.fromImport([1, 2])).toBeNull();
                expect(field.fromImport('[1, 2]')).toBeNull();
            });

            it('should return null for malformed JSON string', () => {
                expect(field.fromImport('{ "broken": ')).toBeNull();
            });

            it('should return null for primitives', () => {
                expect(field.fromImport(123)).toBeNull();
                expect(field.fromImport('plain string')).toBeNull();
            });
        });

        describe('toExport', () => {
            it('should stringify object', () => {
                const data = { a: 1 };
                expect(field.toExport(data)).toBe('{"a":1}');
            });

            it('should return null for null input', () => {
                expect(field.toExport(null)).toBeNull();
            });
        });

        describe('parseJsonString Helper', () => {
            it('should parse safely and return object', () => {
                const res = field.parseJsonString('{"a":1}');
                expect(res.value).toEqual({ a: 1 });
                expect(res.error).toBeUndefined();
            });

            it('should return error for invalid syntax', () => {
                const res = field.parseJsonString('bad json');
                expect(res.value).toBeNull();
                expect(res.error).toBe('Geçersiz JSON formatı');
            });

            it('should return error for Array root', () => {
                const res = field.parseJsonString('[]');
                expect(res.value).toBeNull();
                expect(res.error).toBe('JSON bir obje olmalı');
            });
        });
    });

    // --------------------------------------------------------------------------
    // 4. PRESENTATION & UI HELPERS
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {

        it('should format JSON string', () => {
            const field = new JsonField('p', 'P');
            const data = { a: 1 };
            expect(field.present(data)).toBe('{"a":1}');
        });

        it('should pretty print if configured', () => {
            const field = new JsonField('p', 'P', { prettyPrint: true });
            const data = { a: 1 };
            // Indentation check (newlines and spaces)
            expect(field.present(data)).toContain('\n');
            expect(field.present(data)).toContain('  "a": 1');
        });

        it('should truncate long JSONs', () => {
            const field = new JsonField('p', 'P', { maxDisplayLength: 10 });
            const data = { longKey: 'longValue' }; // Length > 10
            const output = field.present(data);

            expect(output.length).toBeGreaterThan(10); // output = json substring + '...'
            expect(output).toContain('...');
        });

        it('should handle circular references gracefully (Crash Test)', () => {
            const field = new JsonField('p', 'P');
            const circular: any = {};
            circular.myself = circular;

            // JSON.stringify throws on circular.
            // present method uses try-catch -> returns "[Geçersiz JSON]"
            expect(field.present(circular)).toBe('[Geçersiz JSON]');
        });
    });

    describe('Equality & Cloning', () => {
        const field = new JsonField('util', 'Util');

        it('isEqual should compare deeply', () => {
            const a = { x: { y: 1 } };
            const b = { x: { y: 1 } };
            const c = { x: { y: 2 } };

            expect(field.isEqual(a, b)).toBe(true);
            expect(field.isEqual(a, c)).toBe(false);
        });

        it('clone should create deep copy', () => {
            const original = { x: { y: 1 } };
            const copy = field.clone(original);

            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            // Nested object reference check
            expect((copy as any).x).not.toBe(original.x);
        });
    });
});