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
    httpMock.verify(); // Garante que não há requisições "fantasmas"
  });

  it("deve buscar receitas por data", () => {
    service.getRevenueByDateData("2026-08-01", "2026-08-31").subscribe();

    // Ignora a base url e os query params, foca apenas na rota para não quebrar
    const req = httpMock.expectOne(
      (request) =>
        request.url.includes("/reports/date") && !request.url.includes("pdf"),
    );
    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve buscar receitas por categoria", () => {
    service.getRevenueByCategoryData().subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url.includes("/reports/category") &&
        !request.url.includes("pdf"),
    );
    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve gerar PDF por data", () => {
    service.generateRevenueByDateReport("2026-08-01", "2026-08-31").subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes("/reports/date/pdf"),
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });

  it("deve gerar PDF por categoria", () => {
    service.generateCategoriesReport().subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes("/reports/category/pdf"),
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
