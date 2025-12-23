import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FieldValue } from '../core/interfaces';

/**
 * TR: Field hatalarını gösteren bileşen.
 * Hem Angular Forms hem de Zignal FieldValue ile çalışır.
 */
@Component({
    selector: 'zg-errors',
    standalone: true,
    imports: [],
    template: `
        @if (shouldShow() && errorText()) {
            <div class="zg-error" role="alert">
                {{ errorText() }}
            </div>
        }
    `,
    styles: [`
        .zg-error {
            color: #dc2626;
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZgErrorsComponent {
    /**
     * TR: Zignal FieldValue state (Öncelikli)
     */
    readonly state = input<FieldValue<unknown>>();

    /**
     * TR: Angular Form control (Alternatif)
     */
    readonly control = input<AbstractControl | null>();

    /**
     * TR: Hata gösterilsin mi?
     */
    readonly shouldShow = computed(() => {
        // Zignal state varsa
        const state = this.state();
        if (state) {
            return state.touched() && !state.valid();
        }

        // Angular control varsa
        const control = this.control();
        if (control) {
            return control.touched && control.invalid;
        }

        return false;
    });

    /**
     * TR: Hata metni
     */
    readonly errorText = computed((): string | null => {
        // Zignal state'den al (öncelikli)
        const state = this.state();
        if (state) {
            return state.error();
        }

        // Angular control'den al
        const control = this.control();
        if (control?.errors) {
            return this.extractAngularError(control.errors);
        }

        return null;
    });

    private extractAngularError(errors: Record<string, unknown>): string {
        const firstError = Object.values(errors)[0];

        if (typeof firstError === 'object' && firstError && 'message' in firstError) {
            return (firstError as { message: string }).message;
        }

        // Standart Angular hata mesajları
        if (errors['required']) return 'Bu alan zorunludur';
        if (errors['email']) return 'Geçerli bir e-posta adresi giriniz';
        if (errors['minlength']) {
            const { requiredLength } = errors['minlength'] as { requiredLength: number };
            return `En az ${requiredLength} karakter olmalıdır`;
        }
        if (errors['maxlength']) {
            const { requiredLength } = errors['maxlength'] as { requiredLength: number };
            return `En fazla ${requiredLength} karakter olmalıdır`;
        }
        if (errors['min']) {
            const { min } = errors['min'] as { min: number };
            return `En az ${min} olmalıdır`;
        }
        if (errors['max']) {
            const { max } = errors['max'] as { max: number };
            return `En fazla ${max} olmalıdır`;
        }

        return 'Geçersiz değer';
    }
}
