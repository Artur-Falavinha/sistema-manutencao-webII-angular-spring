import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: unknown, limit = 30): string {
    if (!value) return '';

    return String(value).slice(0, limit);
  }
}
