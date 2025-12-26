import { Type } from '@angular/core';
import { IField } from '../../../core/interfaces';
import {
    StringField, NumberField, BooleanField, SelectField,
    MultiselectField, TextareaField, PasswordField, EmailField,
    UrlField, PhoneField, ColorField, DateField, FileField,
    MaskedField, MoneyField, PercentField, SlugField,
    TimeField, JsonField, TagsField, RatingField
} from '../../../fields';

import {
    ZgStringComponent, ZgNumberComponent, ZgBooleanComponent,
    ZgSelectComponent, ZgMultiselectComponent, ZgTextareaComponent,
    ZgPasswordComponent, ZgEmailComponent, ZgUrlComponent,
    ZgPhoneComponent, ZgColorComponent, ZgDateComponent,
    ZgFileComponent, ZgMaskedComponent, ZgMoneyComponent,
    ZgPercentComponent, ZgSlugComponent, ZgTimeComponent,
    ZgJsonComponent, ZgTagsComponent, ZgRatingComponent
} from '../components';

type FieldConstructor = new (...args: any[]) => IField<unknown>;

interface FieldComponentEntry {
    fieldClass: FieldConstructor;
    component: Type<unknown>;
}

/**
 * Sıralama önemli! Önce spesifik tipler kontrol edilmeli.
 * (PasswordField extends StringField gibi durumlar için)
 */
const FIELD_COMPONENT_MAP: FieldComponentEntry[] = [
    // String türevleri (önce)
    { fieldClass: PasswordField, component: ZgPasswordComponent },
    { fieldClass: EmailField, component: ZgEmailComponent },
    { fieldClass: UrlField, component: ZgUrlComponent },
    { fieldClass: PhoneField, component: ZgPhoneComponent },
    { fieldClass: SlugField, component: ZgSlugComponent },
    { fieldClass: MaskedField, component: ZgMaskedComponent },
    { fieldClass: TextareaField, component: ZgTextareaComponent },
    { fieldClass: StringField, component: ZgStringComponent },

    // Number türevleri
    { fieldClass: MoneyField, component: ZgMoneyComponent },
    { fieldClass: PercentField, component: ZgPercentComponent },
    { fieldClass: RatingField, component: ZgRatingComponent },
    { fieldClass: NumberField, component: ZgNumberComponent },

    // Select türevleri
    { fieldClass: MultiselectField, component: ZgMultiselectComponent },
    { fieldClass: SelectField, component: ZgSelectComponent },

    // Diğerleri
    { fieldClass: BooleanField, component: ZgBooleanComponent },
    { fieldClass: DateField, component: ZgDateComponent },
    { fieldClass: TimeField, component: ZgTimeComponent },
    { fieldClass: ColorField, component: ZgColorComponent },
    { fieldClass: FileField, component: ZgFileComponent },
    { fieldClass: JsonField, component: ZgJsonComponent },
    { fieldClass: TagsField, component: ZgTagsComponent },
];

/**
 * Field instance'ından uygun component'ı döner.
 */
export function getComponentForField(field: IField<unknown>): Type<unknown> | null {
    for (const entry of FIELD_COMPONENT_MAP) {
        if (field instanceof entry.fieldClass) {
            return entry.component;
        }
    }
    return null;
}

/**
 * Field type string'inden component döner.
 */
export function getComponentByType(type: string): Type<unknown> | null {
    const map: Record<string, Type<unknown>> = {
        'string': ZgStringComponent,
        'number': ZgNumberComponent,
        'boolean': ZgBooleanComponent,
        'select': ZgSelectComponent,
        'multiselect': ZgMultiselectComponent,
        'textarea': ZgTextareaComponent,
        'password': ZgPasswordComponent,
        'email': ZgEmailComponent,
        'url': ZgUrlComponent,
        'phone': ZgPhoneComponent,
        'color': ZgColorComponent,
        'date': ZgDateComponent,
        'time': ZgTimeComponent,
        'file': ZgFileComponent,
        'masked': ZgMaskedComponent,
        'money': ZgMoneyComponent,
        'percent': ZgPercentComponent,
        'slug': ZgSlugComponent,
        'json': ZgJsonComponent,
        'tags': ZgTagsComponent,
        'rating': ZgRatingComponent,
    };
    return map[type] ?? null;
}
