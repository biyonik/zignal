import {
    Directive,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    effect,
    inject,
    DestroyRef,
} from '@angular/core';
import {
    FormGroup,
    FormControl,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { FormSchema, FormState, FormDataType } from '../core/form-state';
import { IField } from '../core/interfaces';

/**
 * TR: Zod schema'yı Angular validator fonksiyonuna dönüştürür.
 */
export function zodValidator<T>(field: IField<T>) {
    return (control: AbstractControl): ValidationErrors | null => {
        const result = field.schema().safeParse(control.value);

        if (result.success) {
            return null;
        }

        const errors: ValidationErrors = {};
        // TR: Zod'da hata dizisi 'issues' property'sinde bulunur
        // EN: In Zod, error array is in 'issues' property
        const zodIssues = result.error?.issues ?? [];

        for (const issue of zodIssues) {
            errors[issue.code || 'zodError'] = {
                message: issue.message,
                path: issue.path,
            };
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

/**
 * TR: FormSchema'dan Angular FormGroup oluşturur.
 */
export function createFormGroup<T extends FormDataType>(
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
 * TR: Senkronizasyon modu.
 */
export type SyncMode = 'zignal' | 'angular' | 'bidirectional';

/**
 * TR: FormSchema ile çalışan ve senkronizasyon sağlayan directive.
 *
 * @example
 * ```html
 * <!-- Zignal-first (önerilen) -->
 * <form [zgForm]="schema" [formState]="formState" (zgSubmit)="onSubmit($event)">
 *
 * <!-- Angular Forms ile birlikte -->
 * <form [zgForm]="schema" [formGroup]="myFormGroup" syncMode="bidirectional">
 * ```
 */
@Directive({
    selector: '[zgForm]',
    standalone: true,
    exportAs: 'zgForm',
})
export class ZgFormDirective<T extends FormDataType> implements OnInit, OnDestroy {
    private readonly destroyRef = inject(DestroyRef);

    /**
     * TR: Bağlanacak FormSchema.
     */
    @Input({ required: true, alias: 'zgForm' }) schema!: FormSchema<T>;

    /**
     * TR: Zignal FormState (dışarıdan verilebilir veya otomatik oluşturulur).
     */
    @Input() formState?: FormState<T>;

    /**
     * TR: Angular FormGroup (opsiyonel - Angular Forms entegrasyonu için).
     */
    @Input() formGroup?: FormGroup;

    /**
     * TR: Başlangıç değerleri.
     */
    @Input() initialValues?: Partial<T>;

    /**
     * TR: Senkronizasyon modu.
     * - 'zignal': Zignal → Angular (tek yön)
     * - 'angular': Angular → Zignal (tek yön)
     * - 'bidirectional': İki yönlü
     */
    @Input() syncMode: SyncMode = 'zignal';

    /**
     * TR: FormState hazır olduğunda emit edilir.
     */
    @Output() stateReady = new EventEmitter<FormState<T>>();

    /**
     * TR: FormGroup hazır olduğunda emit edilir.
     */
    @Output() formReady = new EventEmitter<FormGroup>();

    /**
     * TR: Form submit edildiğinde emit edilir (valid ise).
     */
    @Output() zgSubmit = new EventEmitter<T>();

    private syncEffectCleanup?: () => void;

    ngOnInit(): void {
        this.initializeStates();
        this.setupSync();
    }

    ngOnDestroy(): void {
        this.syncEffectCleanup?.();
    }

    private initializeStates(): void {
        // Zignal FormState yoksa oluştur
        if (!this.formState) {
            this.formState = this.schema.createForm(this.initialValues);
        }
        this.stateReady.emit(this.formState);

        // Angular FormGroup yoksa ve gerekiyorsa oluştur
        if (!this.formGroup && this.syncMode !== 'zignal') {
            this.formGroup = createFormGroup(this.schema, this.initialValues);
        }
        if (this.formGroup) {
            this.formReady.emit(this.formGroup);
        }
    }

    private setupSync(): void {
        if (!this.formGroup) {
            return;
        }

        if (this.syncMode === 'bidirectional') {
            const effectRef = effect(() => {
                if (!this.formState || !this.formGroup) return;

                const values = this.formState.values();
                Object.entries(values).forEach(([key, value]) => {
                    const control = this.formGroup!.get(key);
                    if (control && control.value !== value) {
                        control.setValue(value, { emitEvent: false });
                    }
                });
            });

            this.destroyRef.onDestroy(() => effectRef.destroy());
        }

        // Angular → Zignal sync
        if (this.syncMode === 'angular' || this.syncMode === 'bidirectional') {
            const subscription = this.formGroup.valueChanges.subscribe(values => {
                if (!this.formState) return;

                Object.entries(values).forEach(([key, value]) => {
                    const fieldValue = this.formState!.fields[key as keyof T];
                    if (fieldValue && fieldValue.value() !== value) {
                        fieldValue.value.set(value as T[keyof T]);
                    }
                });
            });

            this.destroyRef.onDestroy(() => subscription.unsubscribe());
        }
    }

    /**
     * TR: Form'u submit eder.
     */
    async submit(): Promise<void> {
        if (!this.formState) return;

        const isValid = await this.formState.validateAll();

        if (isValid) {
            try {
                const values = this.formState.getValues();
                this.zgSubmit.emit(values);
            } catch (error) {
                console.error('Form validation failed:', error);
            }
        }
    }

    /**
     * TR: Tüm alanları touched olarak işaretler.
     */
    touchAll(): void {
        this.formState?.touchAll();

        if (this.formGroup) {
            Object.values(this.formGroup.controls).forEach(control => {
                control.markAsTouched();
            });
        }
    }

    /**
     * TR: Form'u sıfırlar.
     */
    reset(values?: Partial<T>): void {
        this.formState?.reset(values);
        this.formGroup?.reset(values ?? this.initialValues);
    }

    /**
     * TR: Form'un valid olup olmadığını döner.
     */
    get isValid(): boolean {
        return this.formState?.valid() ?? false;
    }

    /**
     * TR: Form değerlerini döner.
     */
    get values(): T | null {
        try {
            return this.formState?.getValues() ?? null;
        } catch {
            return null;
        }
    }
}
