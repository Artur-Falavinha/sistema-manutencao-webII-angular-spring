import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ReportService } from "./report.service";
import { API_URL } from "../configs/api.token";

describe("ReportService", () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const mockApiUrl = "http://localhost:8080/api";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService, { provide: API_URL, useValue: mockApiUrl }],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Garante que não há requisições pendentes quebrando o afterAll
  });

  it("deve buscar receitas por data (GET /api/reports/date)", () => {
    service
      .getRevenueByDateData("2026-08-01", "2026-08-31")
      .subscribe((res) => {
        expect(res).toBeTruthy();
      });
    const req = httpMock.expectOne(
      `${mockApiUrl}/reports/date?start=2026-08-01&end=2026-08-31`,
    );
    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve buscar receitas por categoria (GET /api/reports/category)", () => {
    service.getRevenueByCategoryData().subscribe((res) => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(`${mockApiUrl}/reports/category`);
    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve gerar PDF por data (GET /api/reports/date/pdf)", () => {
    service
      .generateRevenueByDateReport("2026-08-01", "2026-08-31")
      .subscribe((res) => {
        expect(res).toBeInstanceOf(Blob);
      });
    const req = httpMock.expectOne(
      `${mockApiUrl}/reports/date/pdf?start=2026-08-01&end=2026-08-31`,
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });

  it("deve gerar PDF por categoria (GET /api/reports/category/pdf)", () => {
    service.generateCategoriesReport().subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });
    const req = httpMock.expectOne(`${mockApiUrl}/reports/category/pdf`);
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
