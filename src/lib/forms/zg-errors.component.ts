import {
  Component,
  Input,
  ChangeDetectionStrategy,

} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { IField } from '../core/interfaces';

/**
 * @fileoverview
 * TR: Field hatalarını gösteren bileşen.
 * Hem Angular Forms hem de Zignal FieldValue ile çalışır.
 *
 * EN: Component that displays field errors.
 * Works with both Angular Forms and Zignal FieldValue.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Field hatalarını gösteren bileşen.
 *
 * EN: Component that displays field errors.
 *
 * @example
 * ```html
 * <!-- Angular Forms ile -->
 * <input formControlName="email" />
 * <zg-errors [control]="form.get('email')" />
 *
 * <!-- Field ile -->
 * <input [zgField]="emailField" />
 * <zg-errors [field]="emailField" [state]="emailState" />
 * ```
 */
@Component({
  selector: 'zg-errors',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (errorMessage) {
      <div class="zg-error" role="alert">
        {{ errorMessage }}
      </div>
    }
  `,
  styles: [`
    .zg-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZgErrorsComponent {
  /**
   * TR: Angular Form control.
   *
   * EN: Angular Form control.
   */
  @Input() control?: AbstractControl | null;

  /**
   * TR: Zignal field.
   *
   * EN: Zignal field.
   */
  @Input() field?: IField<unknown>;

  /**
   * TR: Hata mesajını hesaplar.
   *
   * EN: Calculates error message.
   */
  get errorMessage(): string | null {
    // TR: Angular control varsa ondan al
    // EN: Get from Angular control if exists
    if (this.control) {
      if (!this.control.touched || !this.control.errors) {
        return null;
      }

      const firstError = Object.values(this.control.errors)[0];
      if (typeof firstError === 'object' && 'message' in firstError) {
        return firstError.message as string;
      }

      // TR: Standart Angular hataları
      // EN: Standard Angular errors
      if (this.control.errors['required']) {
        return 'Bu alan zorunludur';
      }
      if (this.control.errors['email']) {
        return 'Geçerli bir e-posta adresi giriniz';
      }
      if (this.control.errors['minlength']) {
        const { requiredLength } = this.control.errors['minlength'];
        return `En az ${requiredLength} karakter olmalıdır`;
      }
      if (this.control.errors['maxlength']) {
        const { requiredLength } = this.control.errors['maxlength'];
        return `En fazla ${requiredLength} karakter olmalıdır`;
      }
      if (this.control.errors['min']) {
        const { min } = this.control.errors['min'];
        return `En az ${min} olmalıdır`;
      }
      if (this.control.errors['max']) {
        const { max } = this.control.errors['max'];
        return `En fazla ${max} olmalıdır`;
      }

      return 'Geçersiz değer';
    }

    return null;
  }
}
