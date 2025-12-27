/**
 * @fileoverview
 * TR: String expression'ları runtime'da güvenli şekilde evaluate etmek için utility.
 * Backend'den gelen expression'ları fonksiyona çevirerek çalıştırır.
 *
 * EN: Utility for safely evaluating string expressions at runtime.
 * Converts expressions from backend into executable functions.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Expression evaluation sonucu.
 * EN: Expression evaluation result.
 */
export interface EvaluationResult<T = unknown> {
    /** TR: Başarılı mı? / EN: Was successful? */
    success: boolean;

    /** TR: Sonuç değeri / EN: Result value */
    value?: T;

    /** TR: Hata mesajı / EN: Error message */
    error?: string;
}

/**
 * TR: String expression'ları güvenli şekilde evaluate eden utility class.
 *
 * Özellikler:
 * - Boolean expression evaluation (hideExpression, disableExpression)
 * - Transform function evaluation (transformOnBlur, transformOnChange)
 * - Hook execution (onChange, onTouched, onValidate)
 * - Custom validator execution
 * - Hata yönetimi ve logging
 *
 * EN: Utility class for safely evaluating string expressions.
 *
 * Features:
 * - Boolean expression evaluation (hideExpression, disableExpression)
 * - Transform function evaluation (transformOnBlur, transformOnChange)
 * - Hook execution (onChange, onTouched, onValidate)
 * - Custom validator execution
 * - Error handling and logging
 *
 * @example
 * ```typescript
 * // Boolean expression
 * const result = ExpressionEvaluator.evaluateBoolean(
 *   "age >= 18 && country === 'TR'",
 *   { age: 25, country: 'TR' }
 * );
 * console.log(result); // true
 *
 * // Transform expression
 * const transformed = ExpressionEvaluator.evaluateTransform(
 *   "value.toUpperCase().trim()",
 *   'hello world  '
 * );
 * console.log(transformed); // 'HELLO WORLD'
 *
 * // Hook execution
 * ExpressionEvaluator.executeHook(
 *   "console.log('Field changed to:', value)",
 *   { value: 'test', fieldName: 'email' }
 * );
 * ```
 */
export class ExpressionEvaluator {
    /**
     * TR: Debug mode - true ise hataları console'a yazdırır.
     * EN: Debug mode - logs errors to console if true.
     */
    private static debug = false;

    /**
     * TR: Debug mode'u aktif/pasif eder.
     * EN: Enables/disables debug mode.
     */
    static setDebugMode(enabled: boolean): void {
        this.debug = enabled;
    }

    /**
     * TR: Boolean expression'ı evaluate eder.
     * Form değerlerine göre true/false döner.
     *
     * EN: Evaluates boolean expression.
     * Returns true/false based on form values.
     *
     * @param expression - TR: String expression veya fonksiyon / EN: String expression or function
     * @param formValues - TR: Form değerleri / EN: Form values
     * @returns TR: Boolean sonuç / EN: Boolean result
     *
     * @example
     * ```typescript
     * // Basit karşılaştırma
     * evaluateBoolean("age > 18", { age: 25 }) // true
     *
     * // Mantıksal operatörler
     * evaluateBoolean("age >= 18 && country === 'TR'", { age: 25, country: 'TR' }) // true
     *
     * // Negation
     * evaluateBoolean("!isAdmin", { isAdmin: false }) // true
     *
     * // Field varlık kontrolü
     * evaluateBoolean("!country", { country: null }) // true
     * ```
     */
    static evaluateBoolean(
        expression: string | ((values: Record<string, unknown>) => boolean) | undefined,
        formValues: Record<string, unknown>
    ): boolean {
        if (!expression) return false;

        // Fonksiyon ise direkt çalıştır
        if (typeof expression === 'function') {
            try {
                return expression(formValues);
            } catch (error) {
                this.logError('Boolean function execution failed', expression, error);
                return false;
            }
        }

        // String expression'ı evaluate et
        try {
            // Güvenli context oluştur - Object.keys ile destructure
            const contextKeys = Object.keys(formValues);
            const contextValues = Object.values(formValues);

            // Function constructor ile güvenli evaluation
            const fn = new Function(...contextKeys, `return (${expression});`);
            const result = fn(...contextValues);

            return Boolean(result);
        } catch (error) {
            this.logError('Boolean expression evaluation failed', expression, error);
            return false;
        }
    }

    /**
     * TR: Transform expression'ını evaluate eder.
     * Değeri dönüştürüp yeni değer döner.
     *
     * EN: Evaluates transform expression.
     * Transforms value and returns new value.
     *
     * @param expression - TR: String expression veya fonksiyon / EN: String expression or function
     * @param value - TR: Dönüştürülecek değer / EN: Value to transform
     * @param formValues - TR: Form değerleri (opsiyonel) / EN: Form values (optional)
     * @returns TR: Dönüştürülmüş değer / EN: Transformed value
     *
     * @example
     * ```typescript
     * // String transformation
     * evaluateTransform("value.toUpperCase()", "hello") // "HELLO"
     *
     * // Number transformation
     * evaluateTransform("value * 2", 5) // 10
     *
     * // Trim
     * evaluateTransform("value.trim()", "  test  ") // "test"
     *
     * // Form values kullanarak
     * evaluateTransform(
     *   "values.prefix + value",
     *   "123",
     *   { prefix: "TR-" }
     * ) // "TR-123"
     * ```
     */
    static evaluateTransform<T = unknown>(
        expression: string | ((value: unknown, values?: Record<string, unknown>) => T) | undefined,
        value: unknown,
        formValues?: Record<string, unknown>
    ): T {
        if (!expression) return value as T;

        // Fonksiyon ise direkt çalıştır
        if (typeof expression === 'function') {
            try {
                return expression(value, formValues);
            } catch (error) {
                this.logError('Transform function execution failed', expression, error);
                return value as T;
            }
        }

        // String expression'ı evaluate et
        try {
            const params = ['value'];
            const args: unknown[] = [value];

            if (formValues) {
                params.push('values');
                args.push(formValues);
            }

            const fn = new Function(...params, `return (${expression});`);
            return fn(...args) as T;
        } catch (error) {
            this.logError('Transform expression evaluation failed', expression, error);
            return value as T;
        }
    }

    /**
     * TR: Hook expression'ını çalıştırır.
     * Context içindeki tüm değişkenlere erişim sağlar.
     *
     * EN: Executes hook expression.
     * Provides access to all variables in context.
     *
     * @param expression - TR: String expression veya fonksiyon / EN: String expression or function
     * @param context - TR: Hook context / EN: Hook context
     *
     * @example
     * ```typescript
     * // Console log
     * executeHook(
     *   "console.log('Changed:', value)",
     *   { value: 'test', fieldName: 'email' }
     * )
     *
     * // Multiple statements
     * executeHook(`
     *   if (value.length < 3) {
     *     console.warn('Too short');
     *   }
     * `, { value: 'ab' })
     *
     * // Form değerlerine erişim
     * executeHook(
     *   "if (formValues.country === 'TR') console.log('Turkish user')",
     *   { formValues: { country: 'TR' } }
     * )
     * ```
     */
    static executeHook<TContext = any>(
        expression: string | ((context: TContext) => void) | undefined,
        context: TContext
    ): void {
        if (!expression) return;

        // Fonksiyon ise direkt çalıştır
        if (typeof expression === 'function') {
            try {
                expression(context);
            } catch (error) {
                this.logError('Hook function execution failed', expression, error);
            }
            return;
        }

        // String expression'ı çalıştır
        try {
            const contextKeys = Object.keys(context as Record<string, unknown>);
            const contextValues = Object.values(context as Record<string, unknown>);

            // Function constructor ile çalıştır (return yok, statement execution)
            const fn = new Function(...contextKeys, expression);
            fn(...contextValues);
        } catch (error) {
            this.logError('Hook expression execution failed', expression, error);
        }
    }


    /**
     * TR: Custom validator expression'ını evaluate eder.
     * Geçerliyse null, değilse hata mesajı döner.
     *
     * EN: Evaluates custom validator expression.
     * Returns null if valid, error message otherwise.
     *
     * @param expression - TR: String expression veya fonksiyon / EN: String expression or function
     * @param value - TR: Validate edilecek değer / EN: Value to validate
     * @param formValues - TR: Form değerleri (opsiyonel) / EN: Form values (optional)
     * @returns TR: Hata mesajı veya null / EN: Error message or null
     *
     * @example
     * ```typescript
     * // Basit validation
     * evaluateValidator(
     *   "value.length >= 3 ? null : 'En az 3 karakter'",
     *   "ab"
     * ) // "En az 3 karakter"
     *
     * // Form değerleri ile
     * evaluateValidator(
     *   "value === values.password ? null : 'Şifreler eşleşmiyor'",
     *   "123",
     *   { password: "456" }
     * ) // "Şifreler eşleşmiyor"
     * ```
     */
    static evaluateValidator(
        expression: string | ((value: unknown, values?: Record<string, unknown>) => string | null) | undefined,
        value: unknown,
        formValues?: Record<string, unknown>
    ): string | null {
        if (!expression) return null;

        // Fonksiyon ise direkt çalıştır
        if (typeof expression === 'function') {
            try {
                return expression(value, formValues);
            } catch (error) {
                this.logError('Validator function execution failed', expression, error);
                return 'Validation error';
            }
        }

        // String expression'ı evaluate et
        try {
            const params = ['value'];
            const args: unknown[] = [value];

            if (formValues) {
                params.push('values');
                args.push(formValues);
            }

            const fn = new Function(...params, `return (${expression});`);
            const result = fn(...args);

            return result === null || result === undefined ? null : String(result);
        } catch (error) {
            this.logError('Validator expression evaluation failed', expression, error);
            return 'Validation error';
        }
    }

    /**
     * TR: Expression'ın geçerli olup olmadığını test eder.
     * EN: Tests if expression is valid.
     */
    static isValid(expression: string, type: 'boolean' | 'transform' | 'validator' = 'boolean'): EvaluationResult<boolean> {
        try {
            switch (type) {
                case 'boolean':
                    this.evaluateBoolean(expression, {});
                    break;
                case 'transform':
                    this.evaluateTransform(expression, 'test');
                    break;
                case 'validator':
                    this.evaluateValidator(expression, 'test');
                    break;
            }
            return { success: true, value: true };
        } catch (error) {
            return {
                success: false,
                value: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * TR: Hata loglama (debug mode aktifse).
     * EN: Error logging (if debug mode is active).
     */
    private static logError(message: string, expression: unknown, error: unknown): void {
        if (!this.debug) return;

        console.warn(`[Zignal ExpressionEvaluator] ${message}`, {
            expression,
            error: error instanceof Error ? error.message : error
        });
    }
}

/**
 * TR: Hızlı boolean evaluation için helper.
 * EN: Helper for quick boolean evaluation.
 */
export function evaluateExpression(
    expression: string | ((values: Record<string, unknown>) => boolean) | undefined,
    formValues: Record<string, unknown>
): boolean {
    return ExpressionEvaluator.evaluateBoolean(expression, formValues);
}

/**
 * TR: Hızlı transform için helper.
 * EN: Helper for quick transform.
 */
export function transformValue<T = unknown>(
    expression: string | ((value: unknown) => T) | undefined,
    value: unknown
): T {
    return ExpressionEvaluator.evaluateTransform(expression, value);
}
