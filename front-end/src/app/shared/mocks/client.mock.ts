import { Client } from '../models/client';
import { Estado } from '../models/address';

export const MOCK_CLIENTS: Client[] = [
  {
    id: 1,
    name: 'Ana Beatriz Souza',
    email: 'ana.souza@example.com',
    cpf: '123.456.789-00',
    phoneNumber: '(11) 91234-5678',
    password: '********',
    userAccess: 'client',
    address: {
      id: 1,
      cep: '01310-100',
      logradouro: 'Av. Paulista, 1000',
      complemento: 'Apto 52',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: Estado.SP,
    },
  },
  {
    id: 2,
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@example.com',
    cpf: '987.654.321-00',
    phoneNumber: '(41) 99876-5432',
    password: '********',
    userAccess: 'client',
    address: {
      id: 2,
      cep: '80010-000',
      logradouro: 'Rua XV de Novembro, 250',
      bairro: 'Centro',
      cidade: 'Curitiba',
      estado: Estado.PR,
    },
  },
];
