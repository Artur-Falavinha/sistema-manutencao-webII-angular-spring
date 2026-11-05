import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { serviceItemService } from '../../../../core/services/service-item.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { EmployeService } from '../../services/employe.service';
import { EmployeeRequestDetailDTO } from '../../../../shared/models/maintenance-request.models';
import { MaintenanceRecordDTO } from '../../../../shared/models/maintenance-record.model';
import { ServiceItemDTO } from '../../../../shared/models/service-item.model';
import { Employee } from '../../../../shared/models/employee';

@Component({
  selector: 'app-budget-delivery',
  templateUrl: './budget-delivery.component.html',
  styleUrls: ['./budget-delivery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatDialogModule
  ]
})
export class BudgetDeliveryComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private requestService = inject(MaintenanceRequestService);
  private employeeService = inject(EmployeService);
  private serviceItemService = inject(serviceItemService);

  readonly MANUTENCAO_MIN_LENGTH = 10;
  readonly MANUTENCAO_MAX_LENGTH = 500;

  // Estado da tela
  request!: EmployeeRequestDetailDTO;
  isLoading = true;
  selectedTab = 0;
  funcionariosDisponiveis: Employee[] = [];
  servicosDisponiveis: ServiceItemDTO[] = [];

  responsavel: Employee | null = null;
  dataAtribuicao = '';
  temOrcamento = false;
  valorOrcamento = 0;
  servicosInclusos = '';
  temManutencao = false;
  descricaoManutencao = '';
  orientacaoCliente = 'N/A';

  // Campos dos diálogos
  selectedFuncionario: Employee | null | undefined = undefined;
  servicosSelecionados: ServiceItemDTO[] = [];
  valorTotal = 0;
  manutencaoDescricaoInput = '';
  manutencaoOrientacaoInput = '';
  private dialogRef?: MatDialogRef<unknown>;

  ngOnInit(): void {
    this.employeeService.getEmployees().subscribe(emps => {
      this.funcionariosDisponiveis = emps;
      this.cdr.markForCheck();
    });
    this.serviceItemService.getAllServices().subscribe(servs => {
      this.servicosDisponiveis = servs;
      this.cdr.markForCheck();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequestDetails(Number(id));
    }
  }

  // Carrega a solicitação do back e preenche os cards de responsável, orçamento e manutenção
  loadRequestDetails(id: number): void {
    this.requestService.getRequestByIdForEmployee(id).subscribe({
      next: (data) => {
        this.request = data;
        this.isLoading = false;

        if (data.assignedEmployeeName) {
          this.responsavel = { name: data.assignedEmployeeName } as Employee;
        }
        if (data.budgets && data.budgets.length > 0) {
          this.temOrcamento = true;
          this.valorOrcamento = data.budgets[0].total;
          this.servicosInclusos = data.budgets[0].services;
        }
        if (data.maintenanceRecord) {
          this.temManutencao = true;
          this.descricaoManutencao = data.maintenanceRecord.maintenanceDescription;
          this.orientacaoCliente = data.maintenanceRecord.clientGuidelines;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading request details:', err);
        this.toast.error('Erro', 'Falha ao carregar detalhes da solicitação!');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onVoltarPaginaInicial() {
    this.router.navigate(['/employee/dashboard']);
  }

  private abrirModal(template: TemplateRef<unknown>) {
    this.dialogRef = this.dialog.open(template, { disableClose: true, panelClass: 'custom-dialog' });
  }

  private fecharModal() {
    this.dialogRef?.close();
  }

  // RF015 · Atribuir / redirecionar responsável
  abrirDialog(template: TemplateRef<unknown>) {
    this.selectedFuncionario = this.responsavel ?? undefined;
    this.abrirModal(template);
  }

  cancelarDialog() {
    this.fecharModal();
  }

  mesmoResponsavelSelecionado(): boolean {
    return !!this.selectedFuncionario && !!this.responsavel
      && this.selectedFuncionario.id === this.responsavel.id;
  }

  atribuirResponsavel() {
    if (!this.selectedFuncionario || !this.request) return;

    if (this.mesmoResponsavelSelecionado()) {
      this.toast.warn('Atenção', 'Esse já é o responsável atual pela solicitação.');
      return;
    }

    this.requestService.redirectMaintenance(this.request.id, this.selectedFuncionario.id).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Responsável atribuído com sucesso!');
        this.loadRequestDetails(this.request.id);
        this.responsavel = this.selectedFuncionario || null;
        // A data de atribuição não vem do back: é mostrada só logo depois de atribuir.
        this.dataAtribuicao = new Date().toLocaleString('pt-BR');
        this.fecharModal();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Não foi possível atribuir o responsável.');
      }
    });
  }

  // RF012 · Orçamento
  abrirDialogOrcamento(template: TemplateRef<unknown>) {
    this.servicosSelecionados = [];
    this.valorTotal = 0;
    this.abrirModal(template);
  }

  fecharDialogOrcamento() {
    this.fecharModal();
  }

  atualizarTotal() {
    this.valorTotal = this.servicosSelecionados.reduce((acc, s) => acc + s.valorServico, 0);
    this.cdr.markForCheck();
  }

  orcamentoValido(): boolean {
    return this.servicosSelecionados.length > 0 && this.valorTotal > 0;
  }

  confirmarOrcamento() {
    if (!this.request) return;

    if (!this.orcamentoValido()) {
      this.toast.warn('Atenção', 'Selecione ao menos um serviço com valor válido antes de confirmar.');
      return;
    }

    const payload = { serviceIds: this.servicosSelecionados.map(s => s.id), total: this.valorTotal };

    this.requestService.createBudget(this.request.id, payload).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Orçamento registrado!');
        this.loadRequestDetails(this.request.id);
        this.fecharModal();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Falha ao registrar orçamento.');
      }
    });
  }

  // RF014 · Manutenção
  permitidoCriarManutencao(): boolean {
    if (this.temOrcamento) return true;
    return this.request.status.nome === 'APROVADA' || this.request.status.nome === 'REDIRECIONADA';
  }

  abrirDialogManutencao(template: TemplateRef<unknown>) {
    if (!this.permitidoCriarManutencao()) {
      this.toast.warn('Atenção', 'Não é permitido registrar manutenção neste momento.');
      return;
    }
    this.manutencaoDescricaoInput = this.temManutencao ? this.descricaoManutencao : '';
    this.manutencaoOrientacaoInput = this.temManutencao ? this.orientacaoCliente : '';
    this.abrirModal(template);
  }

  fecharDialogManutencao() {
    this.fecharModal();
  }

  private tamanhoValido(texto: string): boolean {
    const len = texto.trim().length;
    return len >= this.MANUTENCAO_MIN_LENGTH && len <= this.MANUTENCAO_MAX_LENGTH;
  }

  // Campo vazio não mostra erro: o aviso só aparece depois que o funcionário começa a digitar.
  private tamanhoInvalido(texto: string): boolean {
    return texto.trim().length > 0 && !this.tamanhoValido(texto);
  }

  isManutencaoFormValid(): boolean {
    return this.tamanhoValido(this.manutencaoDescricaoInput) && this.tamanhoValido(this.manutencaoOrientacaoInput);
  }

  descricaoManutencaoInvalida(): boolean {
    return this.tamanhoInvalido(this.manutencaoDescricaoInput);
  }

  orientacaoManutencaoInvalida(): boolean {
    return this.tamanhoInvalido(this.manutencaoOrientacaoInput);
  }

  confirmarManutencao() {
    if (!this.request) return;

    if (!this.isManutencaoFormValid()) {
      this.toast.warn('Atenção', `Preencha os dois campos com pelo menos ${this.MANUTENCAO_MIN_LENGTH} caracteres.`);
      return;
    }

    if (this.responsavel?.name !== this.authService.currentUserValue?.name) {
      this.toast.error('Erro ao Efetuar Manutenção', 'Você não é o funcionário designado para essa soliciação');
      return;
    }

    const payload: MaintenanceRecordDTO = {
      id: this.request.maintenanceRecord ? this.request.maintenanceRecord.id : 0,
      maintenanceDescription: this.manutencaoDescricaoInput.trim(),
      clientGuidelines: this.manutencaoOrientacaoInput.trim()
    };

    this.requestService.executeMaintenance(this.request.id, payload).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Manutenção registrada!');
        this.loadRequestDetails(this.request.id);
        this.fecharModal();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Falha ao registrar manutenção.');
      }
    });
  }

  // RF016 · Finalizar
  canFinalizarSolicitacao(): boolean {
    return this.request.status.nome === 'PAGA';
  }

  finalizarSolicitacao(template: TemplateRef<unknown>) {
    this.requestService.finalizeRequest(this.request.id).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Solicitação finalizada com sucesso!');
        this.loadRequestDetails(this.request.id);
        this.dialog.open(template, { disableClose: false, panelClass: 'custom-dialog' });
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Falha ao finalizar a solicitação.');
      }
    });
  }
}
