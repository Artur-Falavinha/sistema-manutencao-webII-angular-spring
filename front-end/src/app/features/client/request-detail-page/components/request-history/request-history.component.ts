import { Component, computed, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { RequestHistory } from '../../../../../shared/models/request-history';

/**
 * Linha do tempo da solicitação (RF008): cada mudança de status com data/hora
 * e responsável, da mais recente para a mais antiga.
 */
@Component({
  selector: 'app-request-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './request-history.component.html',
  styleUrl: './request-history.component.css',
})
export class RequestHistoryComponent {
  history = input<RequestHistory[]>([]);

  sortedHistory = computed(() =>
    [...(this.history() ?? [])].sort(
      (a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime(),
    ),
  );

  /** Troca alguns títulos do backend por frases mais curtas na tela. */
  getDescription(entry: RequestHistory): string {
    const title = entry.title ? entry.title.toLowerCase() : '';

    if (title.includes('criada')) return 'Solicitação aberta';
    if (title.includes('aprovada')) return 'Orçamento aprovado';
    if (title.includes('troca')) return 'Troca de responsável';

    return entry.title;
  }
}
