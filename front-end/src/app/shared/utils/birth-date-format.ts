import { AbstractControl, ValidationErrors } from '@angular/forms';

export function formatBirthDateToDisplay(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  return value;
}

export function parseBirthDateToIso(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) {
    return value;
  }

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return `${year}-${month}-${day}`;
}

export function isValidBirthDate(value: string | null | undefined): boolean {
  const iso = parseBirthDateToIso(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }

  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  );
}

export function birthDateValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  if (control.value instanceof Date) {
    return Number.isNaN(control.value.getTime()) ? { dataInvalida: true } : null;
  }

  return isValidBirthDate(String(control.value)) ? null : { dataInvalida: true };
}

export function dateToIso(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isoToDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!isoMatch) {
    return null;
  }

  const [, year, month, day] = isoMatch;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? null : date;
}
