import {Injectable} from "@angular/core";
import {FieldJsonSchema} from "./interfaces/field-json-schema";
import {FIELD_REGISTRY} from "./registry";

@Injectable({ providedIn: 'root' })
export class SchemaFactory {

    parse(schemas: FieldJsonSchema[]): IField<any>[] {
        return schemas.map(schema => {
            const FieldClass = FIELD_REGISTRY[schema.type];

            if (!FieldClass) {
                console.warn(`Zignal: Bilinmeyen alan tipi! -> ${schema.type}`);
                console.warn(`Zignal: Invalid field type! -> ${schema.type}`);
                return new FIELD_REGISTRY['text'](schema.name, schema);
            }

            return new FieldClass(schema.name, {
                label: schema.label,
                defaultValue: schema.defaultValue,
                ...schema.config
            });
        });
    }
}