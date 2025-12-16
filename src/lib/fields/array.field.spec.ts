import { signal, computed, isSignal } from '@angular/core';
import { z } from 'zod';
import { ArrayField } from './array.field';
import { FieldValue } from '../core';
import { BaseField } from './base.field';

// -----------------------------------------------------------------------------
// TEST HELPER: CONCRETE SUB-FIELD IMPLEMENTATION
// TR: ArrayField'in çalışabilmesi için içine konulacak "Çocuk" alan.
// Gerçek bir StringField gibi davranır, sinyal üretir.
// -----------------------------------------------------------------------------
class TestSubField extends BaseField<string> {
    schema(): z.ZodType<string> {
        // Basit validasyon: Boş olamaz
        return this.applyRequired(z.string().min(1, 'Required'));
    }

    // Sinyal yapısını manuel simüle ediyoruz (BaseField mantığı)
    override createValue(initial?: string): FieldValue<string> {
        const value = signal(initial ?? '');
        const touched = signal(false);

        const valid = computed(() => value().length > 0);
        const error = computed(() => valid() ? null : 'Hata');

        return { value, touched, valid, error };
    }
}

// -----------------------------------------------------------------------------
// EXTREME TEST SUITE
// -----------------------------------------------------------------------------
describe('ArrayField (The Collection Manager) Hard Core Tests', () => {

    // Testlerde kullanacağımız alt alan tanımı (Örn: Bir yapılacaklar listesi)
    const subField = new TestSubField('task', 'Task Name', { required: true });

    describe('1. Configuration & Schema Generation', () => {

        it('should generate a Zod Array Schema', () => {
            const arrayField = new ArrayField('todos', 'Todos', [subField]);
            const schema = arrayField.schema();

            // Valid case
            const validData = [{ task: 'Do unit tests' }];
            expect(schema.safeParse(validData).success).toBe(true);

            // Invalid case (Inner item validation fail)
            const invalidData = [{ task: '' }]; // Empty task not allowed in TestSubField
            expect(schema.safeParse(invalidData).success).toBe(false);
        });

        it('should enforce MIN items constraint via Zod', () => {
            const arrayField = new ArrayField('minTest', 'Min', [subField], { min: 2 });
            const schema = arrayField.schema();

            expect(schema.safeParse([{ task: '1' }]).success).toBe(false);
            expect(schema.safeParse([{ task: '1' }, { task: '2' }]).success).toBe(true);
        });

        it('should enforce MAX items constraint via Zod', () => {
            const arrayField = new ArrayField('maxTest', 'Max', [subField], { max: 1 });
            const schema = arrayField.schema();

            expect(schema.safeParse([{ task: '1' }]).success).toBe(true);
            expect(schema.safeParse([{ task: '1' }, { task: '2' }]).success).toBe(false);
        });
    });

    describe('2. State Management (The Signal Engine)', () => {

        // Her test öncesi taze bir field oluşturalım
        let field: ArrayField;

        beforeEach(() => {
            field = new ArrayField('list', 'List', [subField], {
                min: 1,
                max: 3
            });
        });

        describe('Initialization', () => {
            it('should initialize signals correctly', () => {
                const state = field.createArrayState();

                expect(isSignal(state.items)).toBe(true);
                expect(isSignal(state.values)).toBe(true);
                expect(isSignal(state.valid)).toBe(true);
                expect(isSignal(state.canAdd)).toBe(true);
                expect(isSignal(state.canRemove)).toBe(true);

                expect(state.count()).toBe(0);
            });

            it('should initialize with initial data', () => {
                const initialData = [{ task: 'Init 1' }, { task: 'Init 2' }];
                const state = field.createArrayState(initialData);

                expect(state.count()).toBe(2);
                expect(state.values()).toEqual(initialData);
                // ID'ler üretilmiş olmalı
                expect(state.items()[0].id).toBeDefined();
                expect(state.items()[1].id).toBeDefined();
            });
        });

        describe('CRUD Operations (Add/Remove)', () => {
            it('should ADD items correctly', () => {
                const state = field.createArrayState();

                state.add({ task: 'New Task' });

                expect(state.count()).toBe(1);
                expect(state.values()[0]).toEqual({ task: 'New Task' });
                // Alt alan (SubField) doğru initialize edilmiş mi?
                expect(state.items()[0].fields['task'].value()).toBe('New Task');
            });

            it('should REMOVE items correctly by ID', () => {
                const state = field.createArrayState([{ task: 'A' }, { task: 'B' }]);
                const itemToDelete = state.items()[0]; // A
                const itemToKeep = state.items()[1];   // B

                state.remove(itemToDelete.id);

                expect(state.count()).toBe(1);
                expect(state.items()[0].id).toBe(itemToKeep.id); // B kalmalı
                expect(state.values()[0]).toEqual({ task: 'B' });
            });

            it('should NOT add if MAX limit reached', () => {
                // Max: 3
                const state = field.createArrayState([
                    { task: '1' }, { task: '2' }, { task: '3' }
                ]);

                expect(state.canAdd()).toBe(false);

                // Zorla eklemeyi dene
                state.add({ task: '4' });

                // Değişmemeli
                expect(state.count()).toBe(3);
            });

            it('should NOT remove if MIN limit reached', () => {
                // Min: 1
                const state = field.createArrayState([{ task: '1' }]);

                expect(state.canRemove()).toBe(false);

                // Zorla silmeyi dene
                state.remove(state.items()[0].id);

                // Değişmemeli (Silinmemeli)
                expect(state.count()).toBe(1);
            });
        });

        describe('Reactivity & Deep Validation', () => {
            it('should update global VALUES when a sub-field changes', () => {
                const state = field.createArrayState([{ task: 'Old' }]);

                // Sadece alt alanın sinyalini değiştiriyoruz
                const subFieldSignal = state.items()[0].fields['task'].value;
                subFieldSignal.set('Updated');

                // Üstteki "values" computed sinyali bunu yakalamalı
                expect(state.values()[0]).toEqual({ task: 'Updated' });
            });

            it('should update global VALID status based on sub-fields', () => {
                const state = field.createArrayState([{ task: 'Valid' }]);
                expect(state.valid()).toBe(true);

                // Alt alanı geçersiz yap (SubField boş string kabul etmiyor)
                state.items()[0].fields['task'].value.set('');

                // SubField invalid oldu
                expect(state.items()[0].valid()).toBe(false);
                // ArrayField de invalid olmalı
                expect(state.valid()).toBe(false);
            });
        });

        describe('Reordering (Move)', () => {
            it('should reorder items and preserve IDs', () => {
                const state = field.createArrayState([
                    { task: 'A' }, // index 0
                    { task: 'B' }, // index 1
                    { task: 'C' }  // index 2
                ]);

                const idA = state.items()[0].id;
                const idB = state.items()[1].id;
                state.items()[2].id;
                // Move A (0) to end (2) -> B, C, A
                state.move(0, 2);

                const newItems = state.items();
                expect(newItems[0].fields['task'].value()).toBe('B');
                expect(newItems[1].fields['task'].value()).toBe('C');
                expect(newItems[2].fields['task'].value()).toBe('A');

                // Kritik Kontrol: ID'ler sabit kalmalı (Angular trackBy için)
                expect(newItems[0].id).toBe(idB);
                expect(newItems[2].id).toBe(idA);
            });
        });

        describe('Clear Logic', () => {
            it('should respect MIN count when clearing', () => {
                // Min: 1
                const state = field.createArrayState([
                    { task: 'A' }, { task: 'B' }, { task: 'C' }
                ]);

                state.clear();

                // 0 değil, Min (1) kadar boş kayıt kalmalı
                expect(state.count()).toBe(1);
                // Kalan kayıt boş olmalı (initial state)
                expect(state.items()[0].fields['task'].value()).toBe('');
            });

            it('should empty array if no MIN limit', () => {
                const noLimitField = new ArrayField('nolimit', 'No Limit', [subField]);
                const state = noLimitField.createArrayState([{ task: 'A' }]);

                state.clear();
                expect(state.count()).toBe(0);
            });
        });

        describe('Touch Propagation', () => {
            it('should mark all sub-fields as touched when touchAll is called', () => {
                const state = field.createArrayState([{ task: 'A' }, { task: 'B' }]);

                // Başlangıçta false
                expect(state.items()[0].fields['task'].touched()).toBe(false);

                state.touchAll();

                // Hepsi true olmalı
                expect(state.items()[0].fields['task'].touched()).toBe(true);
                expect(state.items()[1].fields['task'].touched()).toBe(true);
            });
        });
    });

    describe('3. Import/Export Logic', () => {
        const field = new ArrayField('io', 'IO', [subField]);

        it('should parse JSON string correctly', () => {
            const json = '[{"task":"Imported"}]';
            const result = field.fromImport(json);
            expect(result).toHaveLength(1);
            expect(result![0]).toEqual({ task: 'Imported' });
        });

        it('should accept direct Array object', () => {
            const arr = [{ task: 'Direct' }];
            const result = field.fromImport(arr);
            expect(result).toEqual(arr);
        });

        it('should return null for malformed JSON', () => {
            expect(field.fromImport('{ "not": "array" }')).toBeNull();
            expect(field.fromImport('invalid-json')).toBeNull();
        });

        it('should export to JSON string', () => {
            const data = [{ task: 'Export' }];
            const result = field.toExport(data);
            expect(result).toBe(JSON.stringify(data));
        });
    });

    describe('4. UI Helpers', () => {
        const field = new ArrayField('ui', 'Tasks', [subField], {
            itemTitle: 'Görev #{index}'
        });

        it('should format presentation string', () => {
            expect(field.present([{ task: 'A' }, { task: 'B' }])).toBe('2 kayıt');
            expect(field.present([])).toBe('-');
            expect(field.present(null)).toBe('-');
        });

        it('should generate dynamic item titles', () => {
            // index 0 -> Görev #1
            expect(field.getItemTitle(0)).toBe('Görev #1');
            expect(field.getItemTitle(4)).toBe('Görev #5');
        });

        it('should default title if no template provided', () => {
            const defaultField = new ArrayField('d', 'Default', [subField]);
            // Default label -> Default #1
            expect(defaultField.getItemTitle(0)).toBe('Default #1');
        });

        it('should find sub-fields by name', () => {
            const found = field.getItemField('task');
            expect(found).toBeDefined();
            expect(found?.name).toBe('task');

            const notFound = field.getItemField('ghost');
            expect(notFound).toBeUndefined();
        });
    });
});