import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { MOCK_BUDGETS } from "../../shared/mocks/budget.mock";
import { MOCK_CATEGORIES } from "../../shared/mocks/category.mock";
import { MOCK_REQUESTS } from "../../shared/mocks/request.mock";
import {
  RevenueByCategory,
  RevenueByDate,
} from "../../shared/models/reports.model";

@Injectable({
  providedIn: "root",
})
export class ReportService {
  getRevenueByDateData(
    startDate: string,
    endDate: string,
  ): Observable<RevenueByDate[]> {
    const dateMap = new Map<string, number>();

    MOCK_BUDGETS.forEach((budget) => {
      const dateStr = budget.createdAt.split("T")[0];
      const current = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, current + budget.total);
    });

    const data = Array.from(dateMap.entries()).map(([dateStr, total]) => ({
      date: dateStr,
      totalRevenue: total,
    }));

    return of(data);
  }

  getRevenueByCategoryData(): Observable<RevenueByCategory[]> {
    const categoryMap = new Map<number, { name: string; total: number }>();

    MOCK_CATEGORIES.forEach((category) => {
      categoryMap.set(category.id, { name: category.name, total: 0 });
    });

    MOCK_BUDGETS.forEach((budget) => {
      const request = MOCK_REQUESTS.find(
        (mockRequest) => mockRequest.id === budget.requestId,
      );
      if (request) {
        const category = categoryMap.get(request.categoryId);
        if (category) {
          category.total += budget.total;
        }
      }
    });

    const data = Array.from(categoryMap.values())
      .map((category) => ({
        categoryName: category.name,
        totalRevenue: category.total,
      }))
      .sort((first, second) => second.totalRevenue - first.totalRevenue);

    return of(data);
  }

  generateRevenueByDateReport(
    startDate: string,
    endDate: string,
  ): Observable<Blob> {
    const mockBlob = new Blob(["Relatório Simulado - Receita por Data"], {
      type: "application/pdf",
    });
    return of(mockBlob);
  }

  generateCategoriesReport(): Observable<Blob> {
    const mockBlob = new Blob(["Relatório Simulado - Receita por Categoria"], {
      type: "application/pdf",
    });
    return of(mockBlob);
  }
}
