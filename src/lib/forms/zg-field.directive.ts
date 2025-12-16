import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  inject,
  effect
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { IField, FieldValue } from '../core/interfaces';

/**
 * @fileoverview
 * TR: Herhangi bir input elementine Zignal field bağlayan directive.
 * ControlValueAccessor implementasyonu ile Angular Forms entegrasyonu sağlar.
 * Field'ın Zod validasyonunu Angular validator olarak kullanır.
 *
 * EN: Directive that binds a Zignal field to any input element.
 * Provides Angular Forms integration with ControlValueAccessor implementation.
 * Uses the field's Zod validation as an Angular validator.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Zignal field'ını herhangi bir input elementine bağlayan directive.
 *
 * Bu directive şunları sağlar:
 * - Angular Reactive Forms ile tam entegrasyon
 * - Zod validasyonunun Angular validator olarak kullanımı
 * - Field config'den otomatik attribute'lar (placeholder, required, disabled)
 * - Signal-based reaktif state yönetimi
 *
 * EN: Directive that binds a Zignal field to any input element.
 *
 * This directive provides:
 * - Full integration with Angular Reactive Forms
 * - Use of Zod validation as Angular validator
 * - Automatic attributes from field config (placeholder, required, disabled)
 * - Signal-based reactive state management
 *
 * @example
 * ```html
 * <!-- Basit kullanım -->
 * <input zgField [field]="emailField" formControlName="email" />
 *
 * <!-- Tüm özelliklerle -->
 * <input
 *   zgField
 *   [field]="emailField"
 *   formControlName="email"
 *   [showErrors]="true"
 * />
 * ```
 */
@Directive({
  selector: '[zgField]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ZgFieldDirective,
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: ZgFieldDirective,
      multi: true,
    },
  ],
})
export class ZgFieldDirective<T = unknown>
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
    /**
     * TR: Bağlanacak Zignal field instance'ı.
   *
   * EN: Zignal field instance to bind.
   */
  @Input({ required: true }) field!: IField<T>;

  /**
   * TR: Field state'i. Opsiyonel - verilmezse otomatik oluşturulur.
   *
   * EN: Field state. Optional - created automatically if not provided.
   */
  @Input() fieldState?: FieldValue<T>;

  /**
   * TR: Hata mesajlarını otomatik göster.
   *
   * EN: Automatically show error messages.
   */
  @Input() showErrors = false;

  private onChange: (value: T) => void = () => {};
  private onTouched: () => void = () => {};
  private internalState?: FieldValue<T>;

  /**
   * TR: Aktif field state'ini döner.
   *
   * EN: Returns active field state.
   */
  get state(): FieldValue<T> {
    return this.fieldState ?? this.internalState!;
  }

  ngOnInit(): void {
    // TR: State yoksa oluştur
    // EN: Create state if not provided
    if (!this.fieldState) {
      this.internalState = this.field.createValue();
    }

    this.applyFieldAttributes();
    this.setupValueSync();
  }

  ngOnDestroy(): void {
    // TR: Cleanup effect tarafından otomatik yapılır
    // EN: Cleanup is done automatically by effect
  }

  // ===========================================================================
  // TR: ControlValueAccessor Implementation
  // EN: ControlValueAccessor Implementation
  // ===========================================================================

  /**
   * TR: Angular Forms'tan gelen değeri field state'e yazar.
   *
   * EN: Writes value from Angular Forms to field state.
   */
  writeValue(value: T): void {
    if (this.state) {
      this.state.value.set(value);
    }
    this.updateElementValue(value);
  }

  /**
   * TR: Değer değişikliği callback'ini kaydeder.
   *
   * EN: Registers value change callback.
   */
  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  /**
   * TR: Touched callback'ini kaydeder.
   *
   * EN: Registers touched callback.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * TR: Disabled durumunu ayarlar.
   *
   * EN: Sets disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  // ===========================================================================
  // TR: Validator Implementation
  // EN: Validator Implementation
  // ===========================================================================

  /**
   * TR: Zod schema'yı Angular validator olarak çalıştırır.
   *
   * EN: Runs Zod schema as Angular validator.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.field) return null;

    const result = this.field.schema().safeParse(control.value);

    if (result.success) {
      return null;
    }

    // TR: Zod hatalarını Angular ValidationErrors formatına çevir
    // EN: Convert Zod errors to Angular ValidationErrors format
    const errors: ValidationErrors = {};
    for (const error of result.error.errors) {
      const key = error.code || 'zodError';
      errors[key] = {
        message: error.message,
        path: error.path,
      };
    }

    return errors;
  }

  // ===========================================================================
  // TR: Private Methods
  // EN: Private Methods
  // ===========================================================================

  /**
   * TR: Field config'den HTML attribute'larını uygular.
   *
   * EN: Applies HTML attributes from field config.
   */
  private applyFieldAttributes(): void {
    const el = this.el.nativeElement;
    const config = this.field.config;

    // Placeholder
    if (config.placeholder) {
      this.renderer.setAttribute(el, 'placeholder', config.placeholder);
    }

    // Required
    if (config.required) {
      this.renderer.setAttribute(el, 'required', '');
    }

    // Disabled
    if (config.disabled) {
      this.renderer.setProperty(el, 'disabled', true);
    }

    // Readonly
    if (config.readonly) {
      this.renderer.setAttribute(el, 'readonly', '');
    }

    // Aria-label
    this.renderer.setAttribute(el, 'aria-label', this.field.label);
  }

  /**
   * TR: Input event'lerini dinleyerek value sync sağlar.
   *
   * EN: Sets up value sync by listening to input events.
   */
  private setupValueSync(): void {
    const el = this.el.nativeElement;

    // TR: Input event - değer değiştiğinde
    // EN: Input event - when value changes
    this.renderer.listen(el, 'input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = this.parseInputValue(target);
      this.state.value.set(value as T);
      this.onChange(value as T);
    });

    // TR: Blur event - touched olduğunda
    // EN: Blur event - when touched
    this.renderer.listen(el, 'blur', () => {
      this.state.touched.set(true);
      this.onTouched();
    });

    // TR: State değişikliklerini izle (effect ile)
    // EN: Watch state changes (with effect)
    effect(() => {
      const value = this.state.value();
      this.updateElementValue(value);
    }, { allowSignalWrites: true });
  }

  /**
   * TR: Input değerini tipine göre parse eder.
   *
   * EN: Parses input value according to its type.
   */
  private parseInputValue(target: HTMLInputElement): unknown {
    const type = target.type;

    switch (type) {
      case 'number':
      case 'range':
        return target.valueAsNumber;
      case 'checkbox':
        return target.checked;
      case 'date':
      case 'datetime-local':
        return target.valueAsDate;
      default:
        return target.value;
    }
  }

  /**
   * TR: Element değerini günceller.
   *
   * EN: Updates element value.
   */
  private updateElementValue(value: T): void {
    const el = this.el.nativeElement;
    const type = el.type;

    if (type === 'checkbox') {
      this.renderer.setProperty(el, 'checked', !!value);
    } else if (type === 'date' && value instanceof Date) {
      this.renderer.setProperty(el, 'value', value.toISOString().split('T')[0]);
    } else {
      this.renderer.setProperty(el, 'value', value ?? '');
    }
  }
}
