import { MaterialUIAdapter, registerMaterialComponents } from '@biyonik/zignal';
import { ZgMatInputComponent } from './src/components/mat-input.component';
import { ZgMatCheckboxComponent } from './src/components/mat-checkbox.component';
import { ZgMatSelectComponent } from './src/components/mat-select.component';
import { ZgMatChipsComponent } from './src/components/mat-chips.component';
import { ZgMatDatepickerComponent } from './src/components/mat-datepicker.component';
import { ZgMatTextareaComponent } from './src/components/mat-textarea.component';
import { ZgMatSlideToggleComponent } from './src/components/mat-slide-toggle.component';
import { ZgMatRadioComponent } from './src/components/mat-radio.component';
import { ZgMatFileComponent } from './src/components/mat-file.component';

export { BaseMatField } from './src/base-mat-field';
export { ZgMatInputComponent } from './src/components/mat-input.component';
export { ZgMatCheckboxComponent } from './src/components/mat-checkbox.component';
export { ZgMatSelectComponent } from './src/components/mat-select.component';
export { ZgMatChipsComponent } from './src/components/mat-chips.component';
export { ZgMatDatepickerComponent } from './src/components/mat-datepicker.component';
export { ZgMatTextareaComponent } from './src/components/mat-textarea.component';
export { ZgMatSlideToggleComponent } from './src/components/mat-slide-toggle.component';
export { ZgMatRadioComponent } from './src/components/mat-radio.component';
export { ZgMatFileComponent } from './src/components/mat-file.component';

/**
 * TR: Tüm Material bileşenlerini Zignal sistemine kaydeden toplu fonksiyon.
 * EN: Bulk function to register all Material components to Zignal system.
 */
export function provideZignalMaterial(adapter: MaterialUIAdapter) {
    registerMaterialComponents(adapter, {
        matInput: ZgMatInputComponent,
        matCheckbox: ZgMatCheckboxComponent,
        matSelect: ZgMatSelectComponent,
        matChips: ZgMatChipsComponent,
        matDatepicker: ZgMatDatepickerComponent,
    });

    // Additional component registrations
    const componentMap = adapter['componentMap'];
    componentMap['textarea'] = ZgMatTextareaComponent;
    componentMap['file'] = ZgMatFileComponent;
}

/**
 * TR: Material adaptörü ile slide toggle kullan (checkbox yerine)
 */
export function useMaterialSlideToggle(adapter: MaterialUIAdapter) {
    adapter['componentMap']['boolean'] = ZgMatSlideToggleComponent;
}

/**
 * TR: Material adaptörü ile radio button kullan (select yerine - az seçenekli durumlar için)
 */
export function useMaterialRadio(adapter: MaterialUIAdapter) {
    adapter['componentMap']['radio'] = ZgMatRadioComponent;
}
