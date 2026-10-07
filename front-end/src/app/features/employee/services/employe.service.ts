import { inject, Injectable } from '@angular/core';
import { Employee, Role } from '../../../shared/models/employee';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configs/api.token';

@Injectable({
  providedIn: 'root'
})
export class EmployeService {

  private http = inject(HttpClient);
  private apiBaseUrl = inject(API_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/employees`;

  /**
   * Retorna a lista de cargos disponiveis baseada no Enum Role.
   * Usado para preencher o <select> de cargos disponiveis no formulario.
   */
  getCargos(): { value: Role, label: string }[] {
    return Object.values(Role).map(role => ({
      value: role,
      label: role.toString()
    }));
  }

  /**
   * Realiza uma chamada GET para a API.
   * Retorna a lista completa de funcionarios cadastrados no banco.
   */
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  /**
   * Busca os detalhes de um funcionario especifico pelo ID.
   */
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envia um novo funcionario (POST) para o backend.
   */
  addEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  /**
   * Atualiza os dados de um funcionario existente (PUT).
   */
  updateEmployee(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${employee.id}`, employee);
  }

  /**
   * Remove um funcionario pelo ID (DELETE).
   * Realiza uma exclusao logica (inativacao).
   */
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}