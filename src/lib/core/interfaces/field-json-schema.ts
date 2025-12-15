export interface FieldJsonSchema {
    type: string;
    name: string;
    label?: string;
    defaultValue?: any;
    config?: Record<string, any>
}