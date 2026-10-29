import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ReportService } from "./report.service";
import { API_URL } from "../configs/api.token";

describe("ReportService", () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  const mockApiUrl = "http://localhost:8080/api";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: mockApiUrl },
      ],
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("deve buscar receitas por data", () => {
    service
      .getRevenueByDateData("2026-08-01", "2026-08-31")
      .subscribe((res) => {
        expect(res).toEqual([]);
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${mockApiUrl}/reports/date` &&
        request.params.get("start") === "2026-08-01" &&
        request.params.get("end") === "2026-08-31",
    );

    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve buscar receitas por categoria", () => {
    service.getRevenueByCategoryData().subscribe((res) => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/reports/category`);

    expect(req.request.method).toBe("GET");
    req.flush([]);
  });

  it("deve gerar PDF por data", () => {
    service
      .generateRevenueByDateReport("2026-08-01", "2026-08-31")
      .subscribe((res) => {
        expect(res).toBeInstanceOf(Blob);
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${mockApiUrl}/reports/date/pdf` &&
        request.params.get("start") === "2026-08-01" &&
        request.params.get("end") === "2026-08-31",
    );

    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob(["PDF de teste"], { type: "application/pdf" }));
  });

  it("deve gerar PDF por categoria", () => {
    service.generateCategoriesReport().subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/reports/category/pdf`);

    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob(["PDF de teste"], { type: "application/pdf" }));
  });
});
