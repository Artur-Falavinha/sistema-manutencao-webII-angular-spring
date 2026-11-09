import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
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
import { CpfPipesPipe } from '../../../../shared/pipes/cpf.pipes.pipe';
import { PhonePipesPipe } from '../../../../shared/pipes/phone.pipes.pipe';

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
    MatDialogModule,
    CpfPipesPipe,
    PhonePipesPipe
  ]
})
export class BudgetDeliveryComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private requestService = inject(MaintenanceRequestService);
  private employeeService = inject(EmployeService);
  private serviceItemService = inject(serviceItemService);

  readonly MANUTENCAO_MIN_LENGTH = 10;
  readonly MANUTENCAO_MAX_LENGTH = 500;

  // Estado da tela: dado que chega do back e aparece na tela fica em signal
  request = signal<EmployeeRequestDetailDTO | null>(null);
  isLoading = signal(true);
  funcionariosDisponiveis = signal<Employee[]>([]);
  servicosDisponiveis = signal<ServiceItemDTO[]>([]);
  responsavel = signal<Pick<Employee, 'id' | 'name'> | null>(null);
  selectedTab = 0;

  // Valores derivados da solicitação: recalculam sozinhos a cada request.set()
  temOrcamento = computed(() => !!this.request()?.budgets?.length);
  valorOrcamento = computed(() => this.request()?.budgets?.[0]?.total ?? 0);
  servicosInclusos = computed(() => this.request()?.budgets?.[0]?.services ?? '');
  temManutencao = computed(() => !!this.request()?.maintenanceRecord);
  descricaoManutencao = computed(() => this.request()?.maintenanceRecord?.maintenanceDescription ?? '');
  orientacaoCliente = computed(() => this.request()?.maintenanceRecord?.clientGuidelines ?? 'N/A');
  // RF015: o funcionário logado nunca aparece como destino do redirecionamento.
  funcionariosParaRedirecionar = computed(() =>
    this.funcionariosDisponiveis().filter(f => f.active !== false && f.id !== this.idUsuarioLogado())
  );

  // Campos dos diálogos
  selectedFuncionario: Employee | null = null;
  servicosSelecionados: ServiceItemDTO[] = [];
  valorTotal = signal(0);
  manutencaoDescricaoInput = '';
  manutencaoOrientacaoInput = '';
  private dialogRef?: MatDialogRef<unknown>;

  ngOnInit(): void {
    this.employeeService.getEmployees().subscribe(emps => this.funcionariosDisponiveis.set(emps));
    this.serviceItemService.getAllServices().subscribe(servs => this.servicosDisponiveis.set(servs));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequestDetails(Number(id));
    }
  }

  // Carrega a solicitação do back; os cards de orçamento e manutenção se atualizam pelos computed
  loadRequestDetails(id: number): void {
    this.requestService.getRequestByIdForEmployee(id).subscribe({
      next: (data) => {
        this.request.set(data);
        this.isLoading.set(false);
        this.responsavel.set(
          data.assignedEmployeeId ? { id: data.assignedEmployeeId, name: data.assignedEmployeeName ?? '' } : null
        );
      },
      error: (err) => {
        console.error('Error loading request details:', err);
        this.toast.error('Erro', 'Falha ao carregar detalhes da solicitação!');
        this.isLoading.set(false);
      },
    });
  }

  onVoltarPaginaInicial() {
    // Navegar pelo router não fecha diálogo aberto (ex.: o de finalização), então fecha antes.
    this.dialog.closeAll();
    this.router.navigate(['/employee/dashboard']);
  }

  private idUsuarioLogado(): number | undefined {
    return this.authService.currentUserValue?.id;
  }

  souResponsavel(): boolean {
    const atual = this.responsavel();
    return !!atual && atual.id === this.idUsuarioLogado();
  }

  formatarCep(cep: string | null | undefined): string {
    const digitos = (cep ?? '').replace(/\D/g, '');
    return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  }

  private abrirModal(template: TemplateRef<unknown>) {
    this.dialogRef = this.dialog.open(template, { disableClose: true, panelClass: 'custom-dialog' });
  }

  private fecharModal() {
    this.dialogRef?.close();
  }

  // RF015 · Redirecionar manutenção (só o responsável atual, antes da manutenção)
  podeRedirecionar(): boolean {
    return this.permitidoCriarManutencao() && this.souResponsavel();
  }

  abrirDialog(template: TemplateRef<unknown>) {
    this.selectedFuncionario = null;
    this.abrirModal(template);
  }

  cancelarDialog() {
    this.fecharModal();
  }

  redirecionarManutencao() {
    const request = this.request();
    const destino = this.selectedFuncionario;
    if (!destino || !request) return;

    this.requestService.redirectMaintenance(request.id, destino.id).subscribe({
      next: () => {
        this.toast.success('Sucesso', `Manutenção redirecionada para ${destino.name}.`);
        this.loadRequestDetails(request.id);
        this.fecharModal();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Não foi possível redirecionar a manutenção.');
      }
    });
  }

  // RF012 · Orçamento
  abrirDialogOrcamento(template: TemplateRef<unknown>) {
    this.servicosSelecionados = [];
    this.valorTotal.set(0);
    this.abrirModal(template);
  }

  fecharDialogOrcamento() {
    this.fecharModal();
  }

  atualizarTotal() {
    this.valorTotal.set(this.servicosSelecionados.reduce((acc, s) => acc + s.valorServico, 0));
  }

  orcamentoValido(): boolean {
    return this.servicosSelecionados.length > 0 && this.valorTotal() > 0;
  }

  confirmarOrcamento() {
    const request = this.request();
    if (!request) return;

    if (!this.orcamentoValido()) {
      this.toast.warn('Atenção', 'Selecione ao menos um serviço com valor válido antes de confirmar.');
      return;
    }

    const payload = { serviceIds: this.servicosSelecionados.map(s => s.id), total: this.valorTotal() };

    this.requestService.createBudget(request.id, payload).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Orçamento registrado!');
        this.loadRequestDetails(request.id);
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
    const status = this.request()?.status.nome;
    return status === 'APROVADA' || status === 'REDIRECIONADA';
  }

  abrirDialogManutencao(template: TemplateRef<unknown>) {
    if (!this.permitidoCriarManutencao()) {
      this.toast.warn('Atenção', 'Não é permitido registrar manutenção neste momento.');
      return;
    }
    this.manutencaoDescricaoInput = '';
    this.manutencaoOrientacaoInput = '';
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
    const request = this.request();
    if (!request) return;

    if (!this.isManutencaoFormValid()) {
      this.toast.warn('Atenção', `Preencha os dois campos com pelo menos ${this.MANUTENCAO_MIN_LENGTH} caracteres.`);
      return;
    }

    if (!this.souResponsavel()) {
      this.toast.error('Erro ao Efetuar Manutenção', 'Você não é o funcionário designado para essa soliciação');
      return;
    }

    const payload: MaintenanceRecordDTO = {
      id: 0,
      maintenanceDescription: this.manutencaoDescricaoInput.trim(),
      clientGuidelines: this.manutencaoOrientacaoInput.trim()
    };

    this.requestService.executeMaintenance(request.id, payload).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Manutenção registrada!');
        this.loadRequestDetails(request.id);
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
    return this.request()?.status.nome === 'PAGA';
  }

  finalizarSolicitacao(template: TemplateRef<unknown>) {
    const request = this.request();
    if (!request) return;

    this.requestService.finalizeRequest(request.id).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Solicitação finalizada com sucesso!');
        this.loadRequestDetails(request.id);
        this.dialog.open(template, { disableClose: false, panelClass: 'custom-dialog' });
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Falha ao finalizar a solicitação.');
      }
    });
  }
}
