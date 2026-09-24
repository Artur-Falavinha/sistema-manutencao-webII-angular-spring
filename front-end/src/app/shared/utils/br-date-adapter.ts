import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

@Injectable()
export class BrDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === "string" && value.trim()) {
      const parsed = this.parseBrazilianDate(value.trim());

      if (parsed) {
        return parsed;
      }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    return super.parse(value);
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === "DD/MM/YYYY") {
      return this.toBrazilianDate(date);
    }

    return super.format(date, displayFormat);
  }

  private parseBrazilianDate(value: string): Date | null {
    const match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);

    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const date = new Date(year, month, day);

    if (
      date.getFullYear() === year
      && date.getMonth() === month
      && date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  private toBrazilianDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
