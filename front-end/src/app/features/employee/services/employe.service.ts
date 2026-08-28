import { Injectable } from '@angular/core';
import { Employee, Role } from '../../../shared/models/employee';
import { Observable, of } from 'rxjs';
import { MOCK_EMPLOYEES } from '../../../shared/mocks/employee.mock';


@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private readonly formCpfs = ['529.982.247-25', '111.444.777-35'];
  /**
   * Retorna a lista de cargos disponíveis baseada no Enum Role.
   * Usado para preencher o <select> de cargos disponíveis no formulário.
   */
  getCargos(): { value: Role, label: string }[] {
    return Object.values(Role).map(role => ({
      value: role,
      label: role.toString()
    }));
  }

  /**
   * Realiza uma chamada GET para a API.
   * Retorna a lista completa de funcionários cadastrados no banco.
   */
  getEmployees(): Observable<Employee[]> {
    return of(this.getEmployeesForForm());
  }

  /**
   * Busca os detalhes de um funcionário específico pelo ID.
   */
  getEmployeeById(id: number): Observable<Employee> {
    const employees = this.getEmployeesForForm();
    const employee = employees.find(item => item.id === id) ?? employees[0];
    return of({ ...employee });
  }

  /**
   * Envia um novo funcionário (POST) para o backend.
   */
  addEmployee(employee: Employee): Observable<Employee> {
    return of({ ...employee });
  }

  /**
   * Atualiza os dados de um funcionário existente (PUT).
   */
  updateEmployee(employee: Employee): Observable<Employee> {
    return of({ ...employee });
  }

  /**
   * Remove um funcionário pelo ID (DELETE).
   * Realiza uma exclusão lógica (inativação).
   */
  deleteEmployee(_id: number): Observable<void> {
    return of(void 0);
  }

  private getEmployeesForForm(): Employee[] {
    return MOCK_EMPLOYEES.map((employee, index) => ({
      ...employee,
      cpf: this.formCpfs[index] ?? employee.cpf
    }));
  }
}
