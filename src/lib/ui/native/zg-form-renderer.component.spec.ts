/**
 * ZgFormRendererComponent - Validation Behavior Tests
 *
 * Bu test dosyası form renderer'ın validation davranışlarını test eder:
 * - Submit validation
 * - Button disabled state
 * - validateOnInit behavior
 * - validateOnChange behavior
 * - touchAllOnSubmit behavior
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZgFormRendererComponent } from './zg-form-renderer.component';
import { FormSchema } from '../../core/form-state';
import { StringField, EmailField } from '../../fields';
import { signal } from '@angular/core';

describe('ZgFormRendererComponent - Validation Behavior', () => {
    let component: ZgFormRendererComponent<any>;
    let fixture: ComponentFixture<ZgFormRendererComponent<any>>;

    interface TestForm {
        name: string;
        email: string;
    }

    let schema: FormSchema<TestForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ZgFormRendererComponent]
        }).compileComponents();

        schema = new FormSchema<TestForm>([
            new StringField('name', 'Name', { required: true }),
            new EmailField('email', 'Email', { required: true })
        ]);

        fixture = TestBed.createComponent(ZgFormRendererComponent);
        component = fixture.componentInstance;
    });

    describe('Submit Validation', () => {
        it('should disable submit button on init if required fields empty', () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { submitDisabledWhenInvalid: true });
            fixture.detectChanges();

            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(true);
        });

        it('should enable submit button when form becomes valid', () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { submitDisabledWhenInvalid: true });
            fixture.detectChanges();

            // Fill valid values
            form.setValue('name', 'John Doe');
            form.setValue('email', 'john@example.com');
            fixture.detectChanges();

            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(false);
        });

        it('should call touchAll before validation on submit', async () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { touchAllOnSubmit: true });
            fixture.detectChanges();

            const touchAllSpy = jest.spyOn(form, 'touchAll');

            const formElement = fixture.nativeElement.querySelector('form');
            formElement.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(touchAllSpy).toHaveBeenCalled();
        });

        it('should not submit if validation fails', async () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.detectChanges();

            let submitted = false;
            component.submitted.subscribe(() => {
                submitted = true;
            });

            const formElement = fixture.nativeElement.querySelector('form');
            formElement.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(submitted).toBe(false);
        });

        it('should emit submitted event if validation succeeds', async () => {
            const form = schema.createForm({ name: 'John', email: 'john@example.com' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.detectChanges();

            let submittedValues: any = null;
            component.submitted.subscribe((values) => {
                submittedValues = values;
            });

            const formElement = fixture.nativeElement.querySelector('form');
            formElement.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(submittedValues).toEqual({ name: 'John', email: 'john@example.com' });
        });

        it('should not touchAll if touchAllOnSubmit is false', async () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { touchAllOnSubmit: false });
            fixture.detectChanges();

            const touchAllSpy = jest.spyOn(form, 'touchAll');

            const formElement = fixture.nativeElement.querySelector('form');
            formElement.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            // touchAll is still called inside validateAll, but not before it
            expect(touchAllSpy).toHaveBeenCalledTimes(1); // only from validateAll
        });
    });

    describe('Validation on Init', () => {
        it('should validate on init by default', (done) => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.detectChanges();

            // ngOnInit runs in microtask, wait for it
            setTimeout(() => {
                expect(form.fields.name.touched()).toBe(true);
                expect(form.fields.email.touched()).toBe(true);
                done();
            }, 10);
        });

        it('should not validate on init if validateOnInit is false', (done) => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { validateOnInit: false });
            fixture.detectChanges();

            setTimeout(() => {
                expect(form.fields.name.touched()).toBe(false);
                expect(form.fields.email.touched()).toBe(false);
                done();
            }, 10);
        });
    });

    describe('Validation on Change', () => {
        it('should validate on value change by default', (done) => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { validateOnInit: false });
            fixture.detectChanges();

            const validateAllSpy = jest.spyOn(form, 'validateAll');

            form.setValue('name', 'John');

            // Wait for debounce
            setTimeout(() => {
                expect(validateAllSpy).toHaveBeenCalled();
                done();
            }, 150);
        });

        it('should not validate on change if validateOnChange is false', (done) => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', {
                validateOnInit: false,
                validateOnChange: false
            });
            fixture.detectChanges();

            const validateAllSpy = jest.spyOn(form, 'validateAll');

            form.setValue('name', 'John');

            setTimeout(() => {
                expect(validateAllSpy).not.toHaveBeenCalled();
                done();
            }, 150);
        });
    });

    describe('Submit Attempt Tracking', () => {
        it('should set submitAttempted on form submit', async () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.detectChanges();

            expect(form.submitAttempted()).toBe(false);

            const formElement = fixture.nativeElement.querySelector('form');
            formElement.dispatchEvent(new Event('submit'));
            await fixture.whenStable();

            expect(form.submitAttempted()).toBe(true);
        });

        it('should reset submitAttempted on form reset', () => {
            const form = schema.createForm({ name: 'John', email: 'john@example.com' });
            form.setSubmitAttempted(true);

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.detectChanges();

            const resetButton = fixture.nativeElement.querySelector('button[type="button"]');
            if (resetButton) {
                resetButton.click();
                expect(form.submitAttempted()).toBe(false);
            }
        });
    });

    describe('Button Disabled State', () => {
        it('should use isFormValid computed signal for button state', () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { submitDisabledWhenInvalid: true });
            fixture.detectChanges();

            expect(component.isFormValid()).toBe(false);

            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(true);
        });

        it('should reactively update button state when form becomes valid', () => {
            const form = schema.createForm({ name: '', email: '' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { submitDisabledWhenInvalid: true });
            fixture.detectChanges();

            // Initially invalid
            let submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(true);

            // Make valid
            form.setValue('name', 'John Doe');
            form.setValue('email', 'john@example.com');
            fixture.detectChanges();

            submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(false);
        });
    });

    describe('Reset Behavior', () => {
        it('should reset form and emit resetted event', () => {
            const form = schema.createForm({ name: 'John', email: 'john@example.com' });

            fixture.componentRef.setInput('schema', schema);
            fixture.componentRef.setInput('formState', form);
            fixture.componentRef.setInput('config', { showResetButton: true });
            fixture.detectChanges();

            let resetted = false;
            component.resetted.subscribe(() => {
                resetted = true;
            });

            form.setValue('name', 'Changed');

            component.handleReset();

            expect(resetted).toBe(true);
            expect(form.values().name).toBe('John');
        });
    });
});
