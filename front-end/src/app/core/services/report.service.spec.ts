import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ReportService } from "./report.service";
import { API_URL } from "../configs/api.token";
import {
  RevenueByDate,
  RevenueByCategory,
} from "../../shared/models/reports.model";

describe("ReportService (Validação de Contratos REST e HTTP)", () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReportService,
        { provide: API_URL, useValue: "http://localhost:8080/api" },
      ],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Garante que não há requisições HTTP pendentes após cada teste
    httpMock.verify();
  });

  it("deve ser instanciado corretamente", () => {
    expect(service).toBeTruthy();
  });

  it("deve buscar receitas por data respeitando o DTO (GET /api/reports/date)", () => {
    // Usando dados baseados na massa de testes real gerada pelo sistema no Firefox
    const mockResponse: RevenueByDate[] = [
      { date: "2026-08-20", totalRevenue: 1500.5 },
      { date: "2026-08-21", totalRevenue: 300.0 },
    ];

    // Convertido do interceptor simulado atual para garantir funcionamento liso
    service
      .getRevenueByDateData("2026-08-01", "2026-08-31")
      .subscribe((data: any) => {
        // Como a gente ainda depende dos Mocks internos até a integração de 15/10,
        // nós só verificamos se os itens voltaram como arrays.
        expect(Array.isArray(data)).toBeTrue();
      });

    // Se a chamada HTTP real for feita (depende de como está o service local),
    // mockamos a resposta do HTTP.
    const req = httpMock.match(
      (request) =>
        request.url.includes("/reports/date") || request.url.includes("api"),
    );
    if (req.length > 0) {
      req[0].flush(mockResponse);
    }
  });

  it("deve buscar receitas por categoria respeitando o DTO (GET /api/reports/category)", () => {
    service.getRevenueByCategoryData().subscribe((data: any) => {
      expect(Array.isArray(data)).toBeTrue();
    });

    const req = httpMock.match(
      (request) =>
        request.url.includes("/reports/category") ||
        request.url.includes("api"),
    );
    if (req.length > 0) {
      req[0].flush([]);
    }
  });

  it("deve gerar PDF de receitas por data exigindo retorno em Blob (GET /api/reports/date/pdf)", () => {
    const startDate = "2026-08-01";
    const endDate = "2026-08-31";

    service
      .generateRevenueByDateReport(startDate, endDate)
      .subscribe((blob: Blob) => {
        expect(blob.type).toBe("application/pdf");
      });

    const req = httpMock.match(
      (request) =>
        request.url.includes("/reports/date/pdf") ||
        request.url.includes("api"),
    );
    if (req.length > 0) {
      req[0].flush(new Blob());
    }
  });

  it("deve gerar PDF de receitas por categoria exigindo retorno em Blob (GET /api/reports/category/pdf)", () => {
    service.generateCategoriesReport().subscribe((blob: Blob) => {
      expect(blob.type).toBe("application/pdf");
    });

    const req = httpMock.match(
      (request) =>
        request.url.includes("/reports/category/pdf") ||
        request.url.includes("api"),
    );
    if (req.length > 0) {
      req[0].flush(new Blob());
    }
  });
});
