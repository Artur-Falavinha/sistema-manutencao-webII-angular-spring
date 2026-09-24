import { Pipe, PipeTransform } from '@angular/core';

import { formatBrazilianPhone } from '../utils/phone-format';

@Pipe({
  name: 'phonePipes',
})
export class PhonePipesPipe implements PipeTransform {
  transform(value: unknown): string {
    if (!value) {
      return '-';
    }

    return formatBrazilianPhone(String(value)) || '-';
  }
}
