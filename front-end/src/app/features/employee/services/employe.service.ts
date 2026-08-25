import { Injectable } from '@angular/core';
import { Employee, Role } from '../../../shared/models/employee';
import { Observable, of } from 'rxjs';
import { MOCK_EMPLOYEES } from '../../../shared/mocks/employee.mock';


@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private employees: Employee[] = MOCK_EMPLOYEES.map(employee => ({ ...employee }));

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
    return of(this.employees.map(employee => ({ ...employee })));
  }

  /**
   * Busca os detalhes de um funcionário específico pelo ID.
   */
  getEmployeeById(id: number): Observable<Employee> {
    return of(this.employees.find(employee => employee.id === id) ?? this.employees[0]);
  }

  /**
   * Envia um novo funcionário (POST) para o backend.
   */
  addEmployee(employee: Employee): Observable<Employee> {
    const created = { ...employee, id: this.nextId() };
    this.employees = [...this.employees, created];
    return of({ ...created });
  }

  /**
   * Atualiza os dados de um funcionário existente (PUT).
   */
  updateEmployee(employee: Employee): Observable<Employee> {
    this.employees = this.employees.map(current => current.id === employee.id ? { ...employee } : current);
    return of({ ...employee });
  }

  /**
   * Remove um funcionário pelo ID (DELETE).
   * Realiza uma exclusão lógica (inativação).
   */
  deleteEmployee(id: number): Observable<void> {
    this.employees = this.employees.filter(employee => employee.id !== id);
    return of(void 0);
  }

  private nextId(): number {
    return Math.max(0, ...this.employees.map(employee => employee.id)) + 1;
  }
}