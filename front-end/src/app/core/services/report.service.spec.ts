import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ReportService } from "./report.service";

// DTOs baseados exatamente nos contratos REST definidos no Spring Boot (ReportController.java)
interface RevenueByDateDTO {
  date: string;
  totalRevenue: number;
}

interface RevenueByCategoryDTO {
  categoryName: string;
  totalRevenue: number;
}

describe("ReportService (Validação de Contratos REST e HTTP)", () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
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
    const mockResponse: RevenueByDateDTO[] = [
      { date: "2026-08-20", totalRevenue: 1500.5 },
      { date: "2026-08-21", totalRevenue: 300.0 },
    ];
    const startDate = "2026-08-01";
    const endDate = "2026-08-31";

    service.getRevenueByDateData(startDate, endDate).subscribe((data: any) => {
      expect(data.length).toBe(2);
      expect(data).toEqual(mockResponse);
    });

    // Valida se a URL e os parâmetros de data estão sendo passados no contrato
    const req = httpMock.expectOne(
      (request) =>
        request.url.includes("/api/reports/date") &&
        request.params.get("start") === startDate &&
        request.params.get("end") === endDate,
    );

    expect(req.request.method).toBe("GET");
    req.flush(mockResponse); // Simula a resposta do backend com os DTOs corretos
  });

  it("deve buscar receitas por categoria respeitando o DTO (GET /api/reports/category)", () => {
    const mockResponse: RevenueByCategoryDTO[] = [
      { categoryName: "Informática", totalRevenue: 5000 },
      { categoryName: "Eletrodomésticos", totalRevenue: 2500 },
    ];

    service.getRevenueByCategoryData().subscribe((data: any) => {
      expect(data.length).toBe(2);
      expect(data[0].categoryName).toBe("Informática");
      expect(data[1].totalRevenue).toBe(2500);
    });

    const req = httpMock.expectOne((request) =>
      request.url.includes("/api/reports/category"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("deve gerar PDF de receitas por data exigindo retorno em Blob (GET /api/reports/date/pdf)", () => {
    const mockBlob = new Blob(["pdf-data"], { type: "application/pdf" });
    const startDate = "2026-08-01";
    const endDate = "2026-08-31";

    service
      .generateRevenueByDateReport(startDate, endDate)
      .subscribe((blob: Blob) => {
        expect(blob.type).toBe("application/pdf");
        expect(blob.size).toBeGreaterThan(0);
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url.includes("/api/reports/date/pdf") &&
        request.params.get("start") === startDate &&
        request.params.get("end") === endDate,
    );

    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob"); // O contrato REST exige que a leitura seja em Blob
    req.flush(mockBlob);
  });

  it("deve gerar PDF de receitas por categoria exigindo retorno em Blob (GET /api/reports/category/pdf)", () => {
    const mockBlob = new Blob(["pdf-data"], { type: "application/pdf" });

    service.generateCategoriesReport().subscribe((blob: Blob) => {
      expect(blob.type).toBe("application/pdf");
    });

    const req = httpMock.expectOne((request) =>
      request.url.includes("/api/reports/category/pdf"),
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(mockBlob);
  });
});
