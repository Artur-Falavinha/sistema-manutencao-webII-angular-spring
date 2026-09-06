import { Request } from "../models/request";

export const MOCK_REQUESTS: Request[] = [
  {
    id: 1,
    equipmentName: "Notebook Dell Inspiron 15",
    equipmentDescription: "Não liga após queda de energia.",
    requestDate: new Date("2026-08-10T09:15:00"),
    category: "Informática",
    categoryId: 2,
    statusId: 1,
    status: "ABERTA",
    clientId: 1,
    employeeId: 1,
  },
  {
    id: 2,
    equipmentName: 'Smart TV Samsung 50"',
    equipmentDescription:
      "Tela com listras verticais e sem imagem em parte da tela.",
    requestDate: new Date("2026-08-12T14:30:00"),
    category: "Eletrônicos",
    categoryId: 1,
    statusId: 2,
    status: "ORÇADA",
    clientId: 2,
    employeeId: 1,
  },
  {
    id: 3,
    equipmentName: "Geladeira Brastemp Frost Free",
    equipmentDescription:
      "Não está gelando e faz ruído excessivo no compressor.",
    requestDate: new Date("2026-08-05T11:00:00"),
    category: "Eletrodomésticos",
    categoryId: 3,
    statusId: 3,
    status: "APROVADA",
    clientId: 3,
    employeeId: 2,
  },
  {
    id: 4,
    equipmentName: "Roteador TP-Link Archer C6",
    equipmentDescription: "Sinal de Wi-Fi caindo constantemente.",
    requestDate: new Date("2026-08-01T16:45:00"),
    category: "Redes",
    categoryId: 4,
    statusId: 4,
    status: "REJEITADA",
    clientId: 4,
    employeeId: 2,
    rejectionReason:
      "Cliente optou por adquirir equipamento novo em vez de reparo.",
  },
  {
    id: 5,
    equipmentName: "Compressor de ar Schulz",
    equipmentDescription:
      "Equipamento apresenta perda de pressão durante o funcionamento.",
    requestDate: new Date("2026-08-14T10:20:00"),
    category: "Mecânica",
    categoryId: 5,
    statusId: 1,
    status: "ABERTA",
    clientId: 3,
    employeeId: 1,
  },
];
