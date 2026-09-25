import { Provider } from "@angular/core";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
} from "@angular/material/core";
import { BrDateAdapter } from "../utils/br-date-adapter";

export const BR_MAT_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: "DD/MM/YYYY",
  },
  display: {
    dateInput: "DD/MM/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "DD/MM/YYYY",
    monthYearA11yLabel: "MMMM YYYY",
  },
};

export function provideBrazilianMaterialDate(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: "pt-BR" },
    { provide: DateAdapter, useClass: BrDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BR_MAT_DATE_FORMATS },
  ];
}
