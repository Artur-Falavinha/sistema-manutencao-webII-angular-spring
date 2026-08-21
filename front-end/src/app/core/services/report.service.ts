import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { MOCK_BUDGETS } from "../../shared/mocks/budget.mock";
import { MOCK_CATEGORIES } from "../../shared/mocks/category.mock";
import { MOCK_REQUESTS } from "../../shared/mocks/request.mock";

@Injectable({
  providedIn: "root",
})
export class ReportService {
  constructor() {}

  getRevenueByDateData(startDate: string, endDate: string): Observable<any[]> {
    const dateMap = new Map<string, number>();

    MOCK_BUDGETS.forEach((budget: any) => {
      const dateStr = budget.createdAt.split("T")[0];
      const current = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, current + budget.total);
    });

    const data = Array.from(dateMap.entries()).map(([dateStr, total]) => ({
      date: new Date(dateStr + "T12:00:00"),
      totalRevenue: total,
    }));

    return of(data);
  }

  getRevenueByCategoryData(): Observable<any[]> {
    const categoryMap = new Map<number, { name: string; total: number }>();

    MOCK_CATEGORIES.forEach((c: any) => {
      categoryMap.set(c.id, { name: c.name, total: 0 });
    });

    MOCK_BUDGETS.forEach((budget: any) => {
      const request = MOCK_REQUESTS.find((r: any) => r.id === budget.requestId);
      if (request) {
        const cat = categoryMap.get(request.categoryId);
        if (cat) {
          cat.total += budget.total;
        }
      }
    });

    const data = Array.from(categoryMap.values())
      .map((c: any) => ({
        categoryName: c.name,
        totalRevenue: c.total,
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

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
