import { signal, effect, Signal } from '@angular/core';

/**
 * @fileoverview
 * TR: Alan bağımlılıkları ve koşullu görünürlük/aktiflik yönetimi.
 * Bir alanın diğer alanlara bağlı olarak görünür/gizli veya aktif/pasif olmasını sağlar.
 * Ayrıca hesaplanmış değerler (computed values) için destek sunar.
 *
 * EN: Field dependencies and conditional visibility/enablement management.
 * Allows a field to be visible/hidden or enabled/disabled based on other fields.
 * Also provides support for computed values.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Bir alanın diğer alanlara olan bağımlılığını tanımlayan yapılandırma.
 * showWhen, enableWhen ve compute gibi koşullu davranışları tanımlar.
 *
 * EN: Configuration defining a field's dependency on other fields.
 * Defines conditional behaviors like showWhen, enableWhen, and compute.
 *
 * @example
 * ```typescript
 * // Basit showWhen
 * const dependency: FieldDependency = {
 *   dependsOn: ['country'],
 *   showWhen: (values) => values['country'] === 'TR'
 * };
 *
 * // Hesaplanmış değer
 * const totalDep: FieldDependency = {
 *   dependsOn: ['quantity', 'price'],
 *   compute: (values) => (values['quantity'] as number) * (values['price'] as number)
 * };
 * ```
 */
export interface FieldDependency {
  /**
   * TR: Bu alanın bağlı olduğu diğer alanların isimleri.
   * Bu alanlardaki değişiklikler izlenir.
   *
   * EN: Names of other fields this field depends on.
   * Changes in these fields are tracked.
   */
  dependsOn: string[];

  /**
   * TR: Alanın görünür olup olmayacağını belirleyen koşul fonksiyonu.
   * true dönerse alan gösterilir, false dönerse gizlenir.
   *
   * EN: Conditional function determining whether the field will be visible.
   * If returns true, the field is shown; if false, it's hidden.
   *
   * @param values - TR: Tüm form değerleri / EN: All form values
   * @returns TR: Görünürlük durumu / EN: Visibility status
   */
  showWhen?: (values: Record<string, unknown>) => boolean;

  /**
   * TR: Alanın aktif (enabled) olup olmayacağını belirleyen koşul fonksiyonu.
   * true dönerse alan düzenlenebilir, false dönerse disabled olur.
   *
   * EN: Conditional function determining whether the field will be enabled.
   * If returns true, the field is editable; if false, it's disabled.
   *
   * @param values - TR: Tüm form değerleri / EN: All form values
   * @returns TR: Aktiflik durumu / EN: Enabled status
   */
  enableWhen?: (values: Record<string, unknown>) => boolean;

  /**
   * TR: Alanın değerini diğer alanlara göre otomatik hesaplayan fonksiyon.
   * Örn: Toplam = Miktar × Birim Fiyat
   *
   * EN: Function that automatically computes the field's value based on other fields.
   * E.g., Total = Quantity × Unit Price
   *
   * @param values - TR: Tüm form değerleri / EN: All form values
   * @returns TR: Hesaplanmış değer / EN: Computed value
   */
  compute?: (values: Record<string, unknown>) => unknown;

  /**
   * TR: Bağımlı olunan alanlar değiştiğinde çalışacak callback.
   * API çağrısı yapmak veya seçenekleri güncellemek için kullanılır.
   *
   * EN: Callback to run when dependent fields change.
   * Used to make API calls or update options.
   *
   * @param values - TR: Tüm form değerleri / EN: All form values
   * @param context - TR: Bağlam nesnesi / EN: Context object
   */
  onDependencyChange?: (values: Record<string, unknown>, context: DependencyContext) => void | Promise<void>;
}

/**
 * TR: Bağımlılık tetiklendiğinde sağlanan araç seti.
 * Alanı sıfırlama veya değer atama yetkisi verir.
 *
 * EN: Toolset provided when a dependency is triggered.
 * Grants authority to reset the field or set value.
 */
export interface DependencyContext {
  /**
   * TR: Bağımlılığın ait olduğu alan adı.
   *
   * EN: Name of the field the dependency belongs to.
   */
  fieldName: string;

  /**
   * TR: Alanı varsayılan değerine sıfırlar.
   *
   * EN: Resets the field to its default value.
   */
  reset: () => void;

  /**
   * TR: Alana yeni değer atar.
   *
   * EN: Sets a new value to the field.
   */
  setValue: (value: unknown) => void;
}

/**
 * TR: Bir alanın hesaplanmış bağımlılık durumu.
 * UI bileşenleri bu sinyalleri dinleyerek kendilerini günceller.
 *
 * EN: Computed dependency state of a field.
 * UI components update themselves by listening to these signals.
 */
export interface FieldDependencyState {
  /**
   * TR: Alanın görünür olup olmadığı.
   *
   * EN: Whether the field is visible.
   */
  visible: Signal<boolean>;

  /**
   * TR: Alanın aktif (enabled) olup olmadığı.
   *
   * EN: Whether the field is enabled.
   */
  enabled: Signal<boolean>;

  /**
   * TR: Hesaplanmış değer (compute fonksiyonu varsa).
   *
   * EN: Computed value (if compute function exists).
   */
  computedValue: Signal<unknown>;
}

/**
 * TR: Form içindeki alan bağımlılıklarını yöneten sınıf.
 * Angular Signals ve effect kullanarak reaktif bağımlılık izleme sağlar.
 *
 * EN: Class managing field dependencies within a form.
 * Provides reactive dependency tracking using Angular Signals and effects.
 *
 * @example
 * ```typescript
 * const resolver = new DependencyResolver();
 *
 * // Bağımlılık tanımla
 * resolver.register('city', {
 *   dependsOn: ['country'],
 *   showWhen: (values) => values['country'] != null,
 *   onDependencyChange: (_, ctx) => ctx.reset()
 * });
 *
 * // Hesaplama bağımlılığı
 * resolver.register('total', {
 *   dependsOn: ['quantity', 'price'],
 *   compute: (values) => (values['quantity'] || 0) * (values['price'] || 0)
 * });
 *
 * // Form değerleri ile başlat
 * resolver.initialize(formValuesSignal, setFieldValue, resetField);
 *
 * // UI'da kullan
 * @if (resolver.isVisible('city')) {
 *   <input formControlName="city" />
 * }
 * ```
 */
export class DependencyResolver {
  private dependencies = new Map<string, FieldDependency>();
  private fieldStates = new Map<string, FieldDependencyState>();
  private effectCleanups: (() => void)[] = [];
  private initialized = false;

  /**
   * TR: Bir alan için bağımlılık kuralı kaydeder.
   *
   * EN: Registers a dependency rule for a field.
   *
   * @param fieldName - TR: Bağımlılığın ait olduğu alan / EN: Field the dependency belongs to
   * @param dependency - TR: Bağımlılık tanımı / EN: Dependency definition
   */
  register(fieldName: string, dependency: FieldDependency): void {
    this.dependencies.set(fieldName, dependency);
  }

  /**
   * TR: Birden fazla bağımlılığı tek seferde kaydeder.
   *
   * EN: Registers multiple dependencies at once.
   *
   * @param dependencies - TR: Bağımlılık haritası / EN: Dependencies map
   */
  registerAll(dependencies: Record<string, FieldDependency>): void {
    for (const [fieldName, dependency] of Object.entries(dependencies)) {
      this.register(fieldName, dependency);
    }
  }

  /**
   * TR: Bağımlılık izleme mekanizmasını başlatır.
   * Form'un values sinyaline abone olur ve değişikliklerde kuralları çalıştırır.
   *
   * EN: Initializes the dependency tracking mechanism.
   * Subscribes to form's values signal and executes rules on changes.
   *
   * @param values - TR: Form değerlerini içeren sinyal / EN: Signal containing form values
   * @param setFieldValue - TR: Alan değeri atama fonksiyonu / EN: Field value setter function
   * @param resetField - TR: Alan sıfırlama fonksiyonu / EN: Field reset function
   *
   * @throws Error - TR: Döngüsel bağımlılık tespit edilirse / EN: If circular dependency detected
   */
  initialize(
    values: Signal<Record<string, unknown>>,
    setFieldValue: (name: string, value: unknown) => void,
    resetField: (name: string) => void
  ): void {
    // TR: Önceki effect'leri temizle
    // EN: Clean up previous effects
    this.cleanup();

    // TR: Döngüsel bağımlılık kontrolü
    // EN: Circular dependency check
    if (this.hasCircularDependency()) {
      const cycles = this.findCircularDependencies();
      const cycleStr = cycles.map(c => c.join(' → ')).join(', ');
      throw new Error(
        `[zignal] Döngüsel bağımlılık tespit edildi: ${cycleStr}. ` +
        `Bu sonsuz döngüye neden olur. Alan bağımlılıklarını gözden geçirin.`
      );
    }

    for (const [fieldName, dep] of this.dependencies) {
      // TR: Durum sinyallerini oluştur
      // EN: Create state signals
      const visible = signal(true);
      const enabled = signal(true);
      const computedValue = signal<unknown>(undefined);

      this.fieldStates.set(fieldName, { visible, enabled, computedValue });

      // TR: Bağımlılıkları izlemek için effect oluştur
      // EN: Create effect to watch dependencies
      const cleanup = effect(() => {
        const currentValues = values();

        // TR: Görünürlük kontrolü
        // EN: Visibility check
        if (dep.showWhen) {
          visible.set(dep.showWhen(currentValues));
        }

        // TR: Aktiflik kontrolü
        // EN: Enabled check
        if (dep.enableWhen) {
          enabled.set(dep.enableWhen(currentValues));
        }

        // TR: Hesaplama
        // EN: Computation
        if (dep.compute) {
          const computed = dep.compute(currentValues);
          computedValue.set(computed);
          // TR: Hesaplanan değeri forma yaz
          // EN: Write computed value to form
          setFieldValue(fieldName, computed);
        }

        // TR: Bağımlılık değişim callback'i
        // EN: Dependency change callback
        if (dep.onDependencyChange) {
          const context: DependencyContext = {
            fieldName,
            reset: () => resetField(fieldName),
            setValue: (value) => setFieldValue(fieldName, value),
          };
          dep.onDependencyChange(currentValues, context);
        }
      }, { allowSignalWrites: true });

      this.effectCleanups.push(cleanup.destroy.bind(cleanup));
    }

    this.initialized = true;
  }

  /**
   * TR: Bir alanın bağımlılık durumunu getirir.
   *
   * EN: Gets the dependency state of a field.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Bağımlılık durumu veya undefined / EN: Dependency state or undefined
   */
  getState(fieldName: string): FieldDependencyState | undefined {
    return this.fieldStates.get(fieldName);
  }

  /**
   * TR: Alanın şu an görünür olup olmadığını kontrol eder.
   *
   * EN: Checks if the field is currently visible.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Görünürlük durumu / EN: Visibility status
   */
  isVisible(fieldName: string): boolean {
    const state = this.fieldStates.get(fieldName);
    return state?.visible() ?? true;
  }

  /**
   * TR: Alanın şu an aktif (enabled) olup olmadığını kontrol eder.
   *
   * EN: Checks if the field is currently enabled.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Aktiflik durumu / EN: Enabled status
   */
  isEnabled(fieldName: string): boolean {
    const state = this.fieldStates.get(fieldName);
    return state?.enabled() ?? true;
  }

  /**
   * TR: Alanın hesaplanmış değerini getirir.
   *
   * EN: Gets the computed value of the field.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Hesaplanmış değer / EN: Computed value
   */
  getComputedValue(fieldName: string): unknown {
    const state = this.fieldStates.get(fieldName);
    return state?.computedValue();
  }

  /**
   * TR: Bir alanın hangi alanlara bağlı olduğunu listeler.
   *
   * EN: Lists which fields a field depends on.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Bağımlılık listesi / EN: List of dependencies
   */
  getDependencies(fieldName: string): string[] {
    return this.dependencies.get(fieldName)?.dependsOn ?? [];
  }

  /**
   * TR: Verilen bir alana bağımlı olan diğer alanları listeler.
   *
   * EN: Lists other fields that depend on a given field.
   *
   * @param fieldName - TR: Alan adı / EN: Field name
   * @returns TR: Bağımlı alan listesi / EN: List of dependent fields
   */
  getDependents(fieldName: string): string[] {
    const dependents: string[] = [];
    for (const [name, dep] of this.dependencies) {
      if (dep.dependsOn.includes(fieldName)) {
        dependents.push(name);
      }
    }
    return dependents;
  }

  /**
   * TR: Döngüsel bağımlılık olup olmadığını kontrol eder.
   *
   * EN: Checks if there is a circular dependency.
   *
   * @returns TR: Döngüsel bağımlılık varsa true / EN: True if circular dependency exists
   */
  hasCircularDependency(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const deps = this.dependencies.get(node)?.dependsOn ?? [];
      for (const dep of deps) {
        if (hasCycle(dep)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    for (const name of this.dependencies.keys()) {
      if (hasCycle(name)) return true;
    }
    return false;
  }

  /**
   * TR: Döngüsel bağımlılık zincirlerini bulur.
   *
   * EN: Finds circular dependency chains.
   *
   * @returns TR: Döngüsel zincir listesi / EN: List of circular chains
   */
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const findCycles = (node: string): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const deps = this.dependencies.get(node)?.dependsOn ?? [];
      for (const dep of deps) {
        findCycles(dep);
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const name of this.dependencies.keys()) {
      visited.clear();
      recursionStack.clear();
      path.length = 0;
      findCycles(name);
    }

    return cycles;
  }

  /**
   * TR: Tüm effect'leri ve durumları temizler.
   *
   * EN: Cleans up all effects and states.
   */
  cleanup(): void {
    for (const cleanup of this.effectCleanups) {
      cleanup();
    }
    this.effectCleanups = [];
    this.fieldStates.clear();
    this.initialized = false;
  }

  /**
   * TR: Resolver'ın başlatılıp başlatılmadığını döner.
   *
   * EN: Returns whether the resolver is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// =============================================================================
// TR: Yaygın Bağımlılık Kalıpları (Factory Functions)
// EN: Common Dependency Patterns (Factory Functions)
// =============================================================================

/**
 * TR: Sık kullanılan bağımlılık senaryoları için yardımcı şablonlar.
 * Kod tekrarını önlemek ve okunabilirliği artırmak için kullanılır.
 *
 * EN: Helper templates for common dependency scenarios.
 * Used to prevent code duplication and improve readability.
 *
 * @example
 * ```typescript
 * const dependencies = {
 *   city: DependencyPatterns.showWhenEquals('country', 'TR'),
 *   state: DependencyPatterns.showWhenEquals('country', 'US'),
 *   total: DependencyPatterns.multiply(['quantity', 'price']),
 *   fullName: DependencyPatterns.concat(['firstName', 'lastName'], ' ')
 * };
 *
 * resolver.registerAll(dependencies);
 * ```
 */
export const DependencyPatterns = {
  /**
   * TR: Başka bir alanın değeri X'e eşitse göster.
   *
   * EN: Show if another field's value equals X.
   */
  showWhenEquals: (dependsOn: string, value: unknown): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => values[dependsOn] === value,
  }),

  /**
   * TR: Başka bir alanın değeri doluysa (Truthy) göster.
   *
   * EN: Show if another field's value is Truthy.
   */
  showWhenTruthy: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => Boolean(values[dependsOn]),
  }),

  /**
   * TR: Başka bir alanın değeri boşsa (Falsy) göster.
   *
   * EN: Show if another field's value is Falsy.
   */
  showWhenFalsy: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => !values[dependsOn],
  }),

  /**
   * TR: Başka bir alanın değeri verilen listedeyse göster.
   *
   * EN: Show if another field's value is in the given list.
   */
  showWhenIn: (dependsOn: string, allowedValues: unknown[]): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => allowedValues.includes(values[dependsOn]),
  }),

  /**
   * TR: Başka bir alanın değeri verilen listede DEĞİLSE göster.
   *
   * EN: Show if another field's value is NOT in the given list.
   */
  showWhenNotIn: (dependsOn: string, excludedValues: unknown[]): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => !excludedValues.includes(values[dependsOn]),
  }),

  /**
   * TR: Başka bir alan boşsa bu alanı pasif yap.
   *
   * EN: Disable this field if another field is empty.
   */
  disableWhenEmpty: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    enableWhen: (values) => values[dependsOn] != null && values[dependsOn] !== '',
  }),

  /**
   * TR: Birden fazla alanın sayısal toplamını hesapla.
   *
   * EN: Compute the numerical sum of multiple fields.
   */
  sum: (fields: string[]): FieldDependency => ({
    dependsOn: fields,
    compute: (values) => fields.reduce((sum, f) => sum + (Number(values[f]) || 0), 0),
  }),

  /**
   * TR: İki alanın çarpımını hesapla.
   *
   * EN: Compute the product of two fields.
   */
  multiply: (fields: [string, string]): FieldDependency => ({
    dependsOn: fields,
    compute: (values) => (Number(values[fields[0]]) || 0) * (Number(values[fields[1]]) || 0),
  }),

  /**
   * TR: Birden fazla alanı string olarak birleştir.
   *
   * EN: Concatenate multiple fields as string.
   */
  concat: (fields: string[], separator = ' '): FieldDependency => ({
    dependsOn: fields,
    compute: (values) => fields.map((f) => values[f] ?? '').filter(Boolean).join(separator),
  }),

  /**
   * TR: Bağımlı olunan alan değişirse bu alanı sıfırla.
   *
   * EN: Reset this field if the dependent field changes.
   */
  resetOnChange: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    onDependencyChange: (_, ctx) => ctx.reset(),
  }),

  /**
   * TR: Bağımlı olunan alanların hepsi doluysa göster.
   *
   * EN: Show if all dependent fields are filled.
   */
  showWhenAllFilled: (fields: string[]): FieldDependency => ({
    dependsOn: fields,
    showWhen: (values) => fields.every(f => values[f] != null && values[f] !== ''),
  }),

  /**
   * TR: Bağımlı olunan alanların herhangi biri doluysa göster.
   *
   * EN: Show if any of the dependent fields are filled.
   */
  showWhenAnyFilled: (fields: string[]): FieldDependency => ({
    dependsOn: fields,
    showWhen: (values) => fields.some(f => values[f] != null && values[f] !== ''),
  }),
};
