import { Injectable } from "@angular/core";
import { map, Observable, of } from "rxjs";
import { MOCK_BUDGETS } from "../../shared/mocks/budget.mock";
import { MOCK_CATEGORIES } from "../../shared/mocks/category.mock";
import { MOCK_REQUESTS } from "../../shared/mocks/request.mock";
import {
  RevenueByCategory,
  RevenueByDate,
} from "../../shared/models/reports.model";
import {
  createTextPdf,
  formatReportCurrency,
  formatReportDate,
} from "../../shared/utils/pdf-text-report";

@Injectable({
  providedIn: "root",
})
export class ReportService {
  getRevenueByDateData(
    startDate: string,
    endDate: string,
  ): Observable<RevenueByDate[]> {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;

    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    const dateMap = new Map<string, number>();

    MOCK_BUDGETS.forEach((budget) => {
      const budgetDate = new Date(budget.createdAt);

      if (start && budgetDate < start) {
        return;
      }

      if (end && budgetDate > end) {
        return;
      }

      const dateStr = budget.createdAt.split("T")[0];
      const current = dateMap.get(dateStr) || 0;

      dateMap.set(dateStr, current + budget.total);
    });

    const data = Array.from(dateMap.entries())
      .map(([dateStr, total]) => ({
        date: dateStr,
        totalRevenue: total,
      }))
      .sort((first, second) => first.date.localeCompare(second.date));

    return of(data);
  }

  getRevenueByCategoryData(): Observable<RevenueByCategory[]> {
    const categoryMap = new Map<number, { name: string; total: number }>();

    MOCK_CATEGORIES.forEach((category) => {
      categoryMap.set(category.id, {
        name: category.name,
        total: 0,
      });
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
    return this.getRevenueByDateData(startDate, endDate).pipe(
      map((data) => {
        const periodLabel =
          startDate && endDate
            ? `${formatReportDate(startDate)} ate ${formatReportDate(endDate)}`
            : "Periodo completo";

        const totalRevenue = data.reduce(
          (total, item) => total + item.totalRevenue,
          0,
        );

        const lines = [
          `Periodo: ${periodLabel}`,
          "",
          "Data              Receita",
          ...data.map(
            (item) =>
              `${formatReportDate(item.date).padEnd(16)} ${formatReportCurrency(item.totalRevenue)}`,
          ),
          "",
          `Receita total: ${formatReportCurrency(totalRevenue)}`,
        ];

        return createTextPdf("Relatorio de Receitas por Data", lines);
      }),
    );
  }

  generateCategoriesReport(): Observable<Blob> {
    return this.getRevenueByCategoryData().pipe(
      map((data) => {
        const totalRevenue = data.reduce(
          (total, item) => total + item.totalRevenue,
          0,
        );

        const lines = [
          "Categoria                    Receita",
          ...data.map(
            (item) =>
              `${item.categoryName.padEnd(24)} ${formatReportCurrency(item.totalRevenue)}`,
          ),
          "",
          `Receita total: ${formatReportCurrency(totalRevenue)}`,
        ];

        return createTextPdf("Relatorio de Receitas por Categoria", lines);
      }),
    );
  }
}
