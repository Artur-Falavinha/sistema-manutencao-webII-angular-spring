import { Employee } from '../models/employee';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'João Pedro Alves',
    email: 'joao.alves@oficina.com',
    cpf: '111.222.333-44',
    phone: '(11) 98888-1111',
    birthDate: '1990-04-12',
    wage: 3200,
    password: '********',
    active: true,
  },
  {
    id: 2,
    name: 'Marina Costa',
    email: 'marina.costa@oficina.com',
    cpf: '555.666.777-88',
    phone: '(41) 97777-2222',
    birthDate: '1988-09-30',
    wage: 3500,
    password: '********',
    active: true,
  },
];
