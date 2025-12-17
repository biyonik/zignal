import { Component, Input } from '@angular/core';
import { StringField, NumberField, BooleanField, EmailField } from '../fields';
import { FieldValue, IField } from '../core';

/**
 * UI Field Rendering Tests
 *
 * Bu testler field'ların UI'da nasıl render edildiğini test eder.
 */

// Test component to wrap field rendering
@Component({
    selector: 'test-field-wrapper',
    template: `
        <div class="field-container" [attr.data-field-name]="field?.name">
            <label [attr.for]="field?.name">{{ field?.label }}</label>
            <div class="field-value">{{ fieldState?.value() }}</div>
            <div class="field-error" *ngIf="fieldState?.error()">{{ fieldState?.error() }}</div>
        </div>
    `,
    standalone: true
})
class TestFieldWrapperComponent {
    @Input() field: IField<any> | null = null;
    @Input() fieldState: FieldValue<any> | null = null;
}

describe('UI Field Rendering Tests', () => {

    describe('StringField UI', () => {
        let field: StringField;
        let state: FieldValue<string>;

        beforeEach(() => {
            field = new StringField('username', 'Kullanıcı Adı', {
                required: true,
                placeholder: 'johndoe'
            });
            state = field.createValue('');
        });

        it('should have correct label', () => {
            expect(field.label).toBe('Kullanıcı Adı');
        });

        it('should have placeholder in config', () => {
            expect(field.config.placeholder).toBe('johndoe');
        });

        it('should show error when touched and invalid', () => {
            state.touched.set(true);
            expect(state.error()).toBeTruthy();
        });

        it('should not show error when not touched', () => {
            expect(state.error()).toBeNull();
        });

        it('should be valid when value provided', () => {
            state.value.set('testuser');
            expect(state.valid()).toBe(true);
        });
    });

    describe('NumberField UI', () => {
        let field: NumberField;
        let state: FieldValue<number>;

        beforeEach(() => {
            field = new NumberField('age', 'Yaş', {
                required: true,
                min: 0,
                max: 150
            });
            state = field.createValue(undefined as any);
        });

        it('should validate min constraint', () => {
            state.value.set(-5);
            expect(state.valid()).toBe(false);
        });

        it('should validate max constraint', () => {
            state.value.set(200);
            expect(state.valid()).toBe(false);
        });

        it('should accept valid number', () => {
            state.value.set(25);
            expect(state.valid()).toBe(true);
        });

        it('should present number correctly', () => {
            expect(field.present(1234)).toBe('1234');
            expect(field.present(null)).toBe('-');
        });
    });

    describe('BooleanField UI', () => {
        let field: BooleanField;
        let state: FieldValue<boolean>;

        beforeEach(() => {
            field = new BooleanField('agree', 'Şartları Kabul Ediyorum', {
                required: true
            });
            state = field.createValue(false);
        });

        it('should require true when required', () => {
            state.value.set(false);
            expect(state.valid()).toBe(false);
        });

        it('should be valid when checked', () => {
            state.value.set(true);
            expect(state.valid()).toBe(true);
        });

        it('should present boolean correctly', () => {
            expect(field.present(true)).toBe('Evet');
            expect(field.present(false)).toBe('Hayır');
        });
    });

    describe('EmailField UI', () => {
        let field: EmailField;
        let state: FieldValue<string>;

        beforeEach(() => {
            field = new EmailField('email', 'E-posta Adresi', {
                required: true
            });
            state = field.createValue('');
        });

        it('should reject invalid email format', () => {
            state.value.set('invalid-email');
            expect(state.valid()).toBe(false);
        });

        it('should accept valid email', () => {
            state.value.set('test@example.com');
            expect(state.valid()).toBe(true);
        });

        it('should normalize email on export', () => {
            expect(field.toExport('TEST@EXAMPLE.COM')).toBe('test@example.com');
        });
    });

    describe('Field State Reactivity', () => {
        it('should update error when value changes', () => {
            const field = new StringField('test', 'Test', { required: true });
            const state = field.createValue('');

            state.touched.set(true);
            expect(state.error()).toBeTruthy();

            state.value.set('valid value');
            expect(state.error()).toBeNull();
        });

        it('should maintain valid state independent of touched', () => {
            const field = new StringField('test', 'Test', { required: true });
            const state = field.createValue('');

            // Not touched but still invalid
            expect(state.valid()).toBe(false);

            state.value.set('value');
            expect(state.valid()).toBe(true);
        });
    });
});
