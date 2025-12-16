import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { FormSchema, FormState } from '../core/form-state';
import { IField } from '../core/interfaces';

/**
 * @fileoverview
 * TR: FormSchema'dan otomatik Angular FormGroup oluşturan directive.
 * Zod validasyonlarını Angular validators'a dönüştürür.
 *
 * EN: Directive that automatically creates Angular FormGroup from FormSchema.
 * Converts Zod validations to Angular validators.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Zod schema'yı Angular validator fonksiyonuna dönüştürür.
 *
 * EN: Converts Zod schema to Angular validator function.
 *
 * @param field - TR: Zignal field / EN: Zignal field
 * @returns TR: Angular validator fonksiyonu / EN: Angular validator function
 */
export function zodValidator<T>(field: IField<T>) {
  return (control: AbstractControl): ValidationErrors | null => {
    const result = field.schema().safeParse(control.value);

    if (result.success) {
      return null;
    }

    const errors: ValidationErrors = {};
    for (const error of result.error.errors) {
      errors[error.code || 'zodError'] = {
        message: error.message,
        path: error.path,
      };
    }

    return errors;
  };
}

/**
 * TR: FormSchema'dan Angular FormGroup oluşturan yardımcı fonksiyon.
 *
 * EN: Helper function to create Angular FormGroup from FormSchema.
 *
 * @param schema - TR: Zignal FormSchema / EN: Zignal FormSchema
 * @param initialValues - TR: Başlangıç değerleri / EN: Initial values
 * @returns TR: Angular FormGroup / EN: Angular FormGroup
 *
 * @example
 * ```typescript
 * const userSchema = new FormSchema<UserForm>([
 *   new StringField('email', 'E-posta', { required: true, email: true }),
 *   new NumberField('age', 'Yaş', { min: 18 })
 * ]);
 *
 * const form = createFormGroup(userSchema, { email: '', age: null });
 * ```
 */
export function createFormGroup<T extends Record<string, unknown>>(
  schema: FormSchema<T>,
  initialValues?: Partial<T>
): FormGroup {
  const controls: Record<string, FormControl> = {};

  for (const field of schema.getFields()) {
    const initialValue = initialValues?.[field.name as keyof T] ?? null;

    controls[field.name] = new FormControl(initialValue, {
      validators: [zodValidator(field)],
      updateOn: 'change',
    });
  }

  return new FormGroup(controls);
}

/**
 * TR: FormGroup'u FormSchema ile senkronize tutan directive.
 *
 * EN: Directive that keeps FormGroup synchronized with FormSchema.
 *
 * @example
 * ```html
 * <form [zgForm]="userSchema" (formReady)="onFormReady($event)">
 *   <input formControlName="email" />
 *   <input formControlName="age" type="number" />
 *   <button type="submit">Kaydet</button>
 * </form>
 * ```
 */
@Directive({
  selector: '[zgForm]',
  standalone: true,
  exportAs: 'zgForm',
})
export class ZgFormDirective<T extends Record<string, unknown>> implements OnInit {
    /**
     * TR: Bağlanacak FormSchema.
   *
   * EN: FormSchema to bind.
   */
  @Input({ required: true, alias: 'zgForm' }) schema!: FormSchema<T>;

  /**
   * TR: Başlangıç değerleri.
   *
   * EN: Initial values.
   */
  @Input() initialValues?: Partial<T>;

  /**
   * TR: FormGroup hazır olduğunda emit edilir.
   *
   * EN: Emitted when FormGroup is ready.
   */
  @Output() formReady = new EventEmitter<FormGroup>();

  /**
   * TR: Form submit edildiğinde emit edilir (valid ise).
   *
   * EN: Emitted when form is submitted (if valid).
   */
  @Output() formSubmit = new EventEmitter<T>();

  /**
   * TR: Oluşturulan FormGroup.
   *
   * EN: Created FormGroup.
   */
  formGroup!: FormGroup;

  /**
   * TR: Zignal FormState.
   *
   * EN: Zignal FormState.
   */
  formState!: FormState<T>;

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * TR: Form'u initialize eder.
   *
   * EN: Initializes the form.
   */
  private initializeForm(): void {
    // TR: Angular FormGroup oluştur
    // EN: Create Angular FormGroup
    this.formGroup = createFormGroup(this.schema, this.initialValues);

    // TR: Zignal FormState oluştur
    // EN: Create Zignal FormState
    this.formState = this.schema.createForm(this.initialValues);

    // TR: FormGroup'u emit et
    // EN: Emit FormGroup
    this.formReady.emit(this.formGroup);
  }

  /**
   * TR: Form'u submit eder.
   *
   * EN: Submits the form.
   */
  submit(): void {
    if (this.formGroup.valid) {
      this.formSubmit.emit(this.formGroup.value as T);
    } else {
      this.markAllAsTouched();
    }
  }

  /**
   * TR: Tüm alanları touched olarak işaretler.
   *
   * EN: Marks all fields as touched.
   */
  markAllAsTouched(): void {
    Object.values(this.formGroup.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  /**
   * TR: Form'u sıfırlar.
   *
   * EN: Resets the form.
   */
  reset(values?: Partial<T>): void {
    this.formGroup.reset(values ?? this.initialValues);
  }

  /**
   * TR: Belirli bir alanın hata mesajını döner.
   *
   * EN: Returns error message for a specific field.
   */
  getErrorMessage(fieldName: string): string | null {
    const control = this.formGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const firstError = Object.values(control.errors)[0];
    if (typeof firstError === 'object' && 'message' in firstError) {
      return firstError.message;
    }

    return 'Geçersiz değer';
  }

  /**
   * TR: Form'un valid olup olmadığını döner.
   *
   * EN: Returns whether form is valid.
   */
  get isValid(): boolean {
    return this.formGroup.valid;
  }

  /**
   * TR: Form değerlerini döner.
   *
   * EN: Returns form values.
   */
  get values(): T {
    return this.formGroup.value as T;
  }
}
