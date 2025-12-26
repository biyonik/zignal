import { Expression, ExpressionFn } from './interfaces/field-config.interface';

/**
 * TR: String expression'ı fonksiyona çevirir
 * EN: Converts string expression to function
 */
export function parseExpression(expr: Expression): ExpressionFn {
    if (typeof expr === 'function') {
        return expr;
    }

    // String expression
    return (values: Record<string, unknown>): boolean => {
        try {
            // Basit expression parser
            // !fieldName -> !values['fieldName']
            // fieldName -> !!values['fieldName']
            // fieldName === 'value' -> values['fieldName'] === 'value'
            // fieldName !== 'value' -> values['fieldName'] !== 'value'

            const trimmed = expr.trim();

            // Negation: !fieldName
            if (trimmed.startsWith('!') && !trimmed.includes(' ')) {
                const fieldName = trimmed.slice(1);
                return !values[fieldName];
            }

            // Equality: fieldName === 'value' veya fieldName === value
            const eqMatch = trimmed.match(/^(\w+)\s*===?\s*['"]?(.+?)['"]?$/);
            if (eqMatch) {
                const [, fieldName, expectedValue] = eqMatch;
                const actualValue = values[fieldName];
                return String(actualValue) === expectedValue;
            }

            // Inequality: fieldName !== 'value'
            const neqMatch = trimmed.match(/^(\w+)\s*!==?\s*['"]?(.+?)['"]?$/);
            if (neqMatch) {
                const [, fieldName, expectedValue] = neqMatch;
                const actualValue = values[fieldName];
                return String(actualValue) !== expectedValue;
            }

            // Simple truthy check: fieldName
            if (/^\w+$/.test(trimmed)) {
                return !!values[trimmed];
            }

            // Fallback: false
            console.warn(`[Zignal] Cannot parse expression: "${expr}"`);
            return false;
        } catch (error) {
            console.warn(`[Zignal] Expression evaluation failed: "${expr}"`, error);
            return false;
        }
    };
}
