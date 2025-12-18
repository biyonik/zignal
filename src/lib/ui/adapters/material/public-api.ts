import {MaterialUIAdapter, registerMaterialComponents} from '@biyonik/zignal';
import {ZgMatInputComponent} from "./src/components/mat-input.component";
import {ZgMatCheckboxComponent} from "./src/components/mat-checkbox.component";
import {ZgMatSelectComponent} from "./src/components/mat-select.component";
import {ZgMatChipsComponent} from "./src/components/mat-chips.component";
import {ZgMatDatepickerComponent} from "./src/components/mat-datepicker.component";

export * from './src/base-mat-field';

// TR: Tüm Material bileşenlerini Zignal sistemine kaydeden toplu fonksiyon.
// EN: Bulk function to register all Material components to Zignal system.
export function provideZignalMaterial(adapter: MaterialUIAdapter) {
    registerMaterialComponents(adapter, {
        matInput: ZgMatInputComponent,
        matCheckbox: ZgMatCheckboxComponent,
        matSelect: ZgMatSelectComponent,
        matChips: ZgMatChipsComponent,
        matDatepicker: ZgMatDatepickerComponent
    });
}