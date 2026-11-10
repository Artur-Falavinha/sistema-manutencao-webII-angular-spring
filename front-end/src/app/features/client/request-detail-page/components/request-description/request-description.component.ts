import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ClientRequestDetailDTO } from '../../../../../shared/models/maintenance-request.models';

/**
 * Cartão com os dados da solicitação: equipamento, categoria, data/hora,
 * defeito e o status com a cor que vem do backend.
 */
@Component({
  selector: 'app-request-description',
  imports: [CommonModule, MatIcon],
  templateUrl: './request-description.component.html',
  styleUrl: './request-description.component.css',
})
export class RequestDescriptionComponent {
  @Input() request!: ClientRequestDetailDTO;
}
