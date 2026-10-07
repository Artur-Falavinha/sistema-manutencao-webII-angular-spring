import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { EmployeService } from './employe.service';
import { API_URL } from '../../../core/configs/api.token';
import { Employee, Role } from '../../../shared/models/employee';
import { of } from 'rxjs';

describe('EmployeService (HTTP)', () => {
  let service: EmployeService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  const mockApiUrl = 'http://localhost:8080/api';

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EmployeService,
        { provide: API_URL, useValue: mockApiUrl },
        { provide: HttpClient, useValue: spy }
      ]
    });
    service = TestBed.inject(EmployeService);
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return available roles using getCargos()', () => {
    const cargos = service.getCargos();
    expect(cargos.length).toBeGreaterThan(0);
    expect(cargos[0].value).toBeDefined();
    expect(cargos[0].label).toBeDefined();
  });

  it('should fetch employees via GET', (done) => {
    const mockEmployees: Employee[] = [
      { id: 1, name: 'Luan', email: 'luan@test.com', cpf: '12345678901', phone: '41999999999', birthDate: '1990-01-01', wage: 2000, password: '', active: true }
    ];

    httpClientSpy.get.and.returnValue(of(mockEmployees));

    service.getEmployees().subscribe(employees => {
      expect(employees.length).toBe(1);
      expect(employees).toEqual(mockEmployees);
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${mockApiUrl}/employees`);
      done();
    });
  });

  it('should fetch a single employee by ID via GET', (done) => {
    const mockEmployee: Employee = { id: 1, name: 'Luan', email: 'luan@test.com', cpf: '12345678901', phone: '41999999999', birthDate: '1990-01-01', wage: 2000, password: '', active: true };

    httpClientSpy.get.and.returnValue(of(mockEmployee));

    service.getEmployeeById(1).subscribe(employee => {
      expect(employee).toEqual(mockEmployee);
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${mockApiUrl}/employees/1`);
      done();
    });
  });

  it('should add a new employee via POST', (done) => {
    const newEmployee: Employee = { id: 2, name: 'Novo', email: 'novo@test.com', cpf: '12345678901', phone: '41999999999', birthDate: '1990-01-01', wage: 2000, password: '', active: true };

    httpClientSpy.post.and.returnValue(of(newEmployee));

    service.addEmployee(newEmployee).subscribe(employee => {
      expect(employee).toEqual(newEmployee);
      expect(httpClientSpy.post).toHaveBeenCalledWith(`${mockApiUrl}/employees`, newEmployee);
      done();
    });
  });

  it('should update an existing employee via PUT', (done) => {
    const updatedEmployee: Employee = { id: 1, name: 'Editado', email: 'editado@test.com', cpf: '12345678901', phone: '41999999999', birthDate: '1990-01-01', wage: 2000, password: '', active: true };

    httpClientSpy.put.and.returnValue(of(updatedEmployee));

    service.updateEmployee(updatedEmployee).subscribe(employee => {
      expect(employee).toEqual(updatedEmployee);
      expect(httpClientSpy.put).toHaveBeenCalledWith(`${mockApiUrl}/employees/1`, updatedEmployee);
      done();
    });
  });

  it('should perform logical deletion via DELETE', (done) => {
    httpClientSpy.delete.and.returnValue(of(null));

    service.deleteEmployee(1).subscribe(res => {
      expect(res).toBeNull();
      expect(httpClientSpy.delete).toHaveBeenCalledWith(`${mockApiUrl}/employees/1`);
      done();
    });
  });
});
