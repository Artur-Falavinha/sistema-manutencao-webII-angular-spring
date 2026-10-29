import { Injectable, Inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_URL } from "../configs/api.token";
import {
  RevenueByDate,
  RevenueByCategory,
} from "../../shared/models/reports.model";

@Injectable({
  providedIn: "root",
})
export class ReportService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string,
  ) {}

  // RF019 - Receitas por Data (Dados Reais do Banco)
  getRevenueByDateData(
    startDate?: string,
    endDate?: string,
  ): Observable<RevenueByDate[]> {
    let params = new HttpParams();
    if (startDate) params = params.set("start", startDate);
    if (endDate) params = params.set("end", endDate);

    return this.http.get<RevenueByDate[]>(`${this.apiUrl}/reports/date`, {
      params,
    });
  }

  // RF020 - Receitas por Categoria (Dados Reais do Banco)
  getRevenueByCategoryData(): Observable<RevenueByCategory[]> {
    return this.http.get<RevenueByCategory[]>(
      `${this.apiUrl}/reports/category`,
    );
  }

  // Geração de PDF nativo via OpenPDF (Backend)
  generateRevenueByDateReport(
    startDate?: string,
    endDate?: string,
  ): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set("start", startDate);
    if (endDate) params = params.set("end", endDate);

    return this.http.get(`${this.apiUrl}/reports/date/pdf`, {
      params,
      responseType: "blob",
    });
  }

  // Geração de PDF nativo via OpenPDF (Backend)
  generateCategoriesReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/category/pdf`, {
      responseType: "blob",
    });
  }
}
