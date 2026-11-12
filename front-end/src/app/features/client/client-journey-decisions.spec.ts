import { Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApproveRejectPanelComponent } from './request-detail-page/components/approve-reject-panel/approve-reject-panel.component';
import { PaymentPanelComponent } from './payment-panel/payment-panel.component';
import { AppSuccessModalComponent } from '../../shared/components/modal-mensagem/app-success-modal';
import { MaintenanceRequestService } from '../../core/services/maintenance-request.service';
import { ToastService } from '../../core/services/toast.service';

describe('Jornadas aprovadas do cliente', () => {
  let service: jasmine.SpyObj<MaintenanceRequestService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: any;
  let dialog: any;
  let acknowledgement: Subject<boolean>;
  let component: ApproveRejectPanelComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj('MaintenanceRequestService', ['approveBudget', 'rejectBudget', 'rescueRequest', 'payRequest']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    acknowledgement = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => acknowledgement });
    component = new ApproveRejectPanelComponent(dialog, router, service, toast);
    component.request = { id: 42, equipmentName: 'Notebook', budgets: [{ total: 123.45 }] } as any;
  });

  it('C11 aprova uma única vez, exibe sucesso após a API e navega somente após OK', () => {
    const response = new Subject<void>();
    service.approveBudget.and.returnValue(response);
    component.onApprove(); component.onApprove();
    expect(service.approveBudget).toHaveBeenCalledOnceWith(42);
    expect(dialog.open).not.toHaveBeenCalled();
    response.next(); response.complete();
    expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({ disableClose: true, data: { equipmentName: 'Notebook', total: 123.45 } }));
    expect(router.navigate).not.toHaveBeenCalled();
    acknowledgement.next(true); acknowledgement.complete();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/client/dashboard']);
  });

  it('C11 falha da API não exibe sucesso nem navega e permite tentar novamente', () => {
    service.approveBudget.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.onApprove();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('C44 informa Serviço Rejeitado somente após a rejeição persistir', () => {
    const response = new Subject<void>();
    service.rejectBudget.and.returnValue(response);
    component.confirmRejection('Não desejo continuar.');
    expect(toast.success).not.toHaveBeenCalled();
    response.next(); response.complete();
    expect(toast.success).toHaveBeenCalledOnceWith('Recusado', 'Serviço Rejeitado');
  });

  it('C46 resgata diretamente no detalhe sem diálogo anterior', () => {
    const response = new Subject<any>();
    service.rescueRequest.and.returnValue(response);
    const changed = spyOn(component.statusChanged, 'emit');
    component.resgatarServico();
    expect(service.rescueRequest).toHaveBeenCalledOnceWith(42);
    expect(dialog.open).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    response.next({}); response.complete();
    expect(changed).toHaveBeenCalledOnceWith(42);
  });

  it('C45 paga diretamente, abre AppSuccessModal após a API e aguarda o botão', () => {
    const response = new Subject<any>();
    service.payRequest.and.returnValue(response);
    const payment = new PaymentPanelComponent(service, toast, {} as any);
    payment.currentRequestId = 42; payment.selectedMethod = 'pix';
    spyOn(payment, 'loadRequestDetails');
    payment.payRequest(); payment.payRequest();
    expect(service.payRequest).toHaveBeenCalledOnceWith(42);
    expect(payment.mostrarModal).toBeFalse();
    expect(dialog.open).not.toHaveBeenCalled();
    response.next({}); response.complete();
    expect(payment.mostrarModal).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
    const modal = new AppSuccessModalComponent(router);
    modal.rotaDestino = payment.modalRotaDestino;
    modal.fecharModal();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/client/dashboard/']);
  });

  it('C45 falha de pagamento não abre o modal de sucesso', () => {
    service.payRequest.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const payment = new PaymentPanelComponent(service, toast, {} as any);
    payment.currentRequestId = 42; payment.selectedMethod = 'pix';
    payment.payRequest();
    expect(payment.mostrarModal).toBeFalse();
    expect(payment.isProcessingPayment).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
