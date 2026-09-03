import { Component, OnInit, ViewChild } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { ReportService } from "../../../../core/services/report.service";
import {
  RevenueByCategory,
  RevenueByDate,
} from "../../../../shared/models/reports.model";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormBuilder,
} from "@angular/forms";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { CommonModule } from "@angular/common";
import { MatPaginator } from "@angular/material/paginator";

@Component({
  selector: "app-reports-page",
  imports: [
    MatIcon,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTableModule,
    CommonModule,
    MatPaginator,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: "./reports-page.component.html",
  styleUrl: "./reports-page.component.css",
})
export class ReportsPageComponent implements OnInit {
  isReportsTotalView: boolean = true;

  revenueByDate: RevenueByDate[] = [];
  revenueByCategory: RevenueByCategory[] = [];

  datasource: MatTableDataSource<RevenueByDate> =
    new MatTableDataSource<RevenueByDate>(this.revenueByDate);

  range: FormGroup;

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator | undefined) {
    if (paginator) {
      this.datasource.paginator = paginator;
    }
  }

  receitaTotal: number = 0;

  displayedColumns: string[] = ["date", "totalRevenue"];

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
  ) {
    this.range = this.fb.group({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });
  }

  ngOnInit(): void {
    this.loadRevenueByCategoryData();
    this.loadRevenueByDateData("", "");
  }

  get start() {
    return this.range.get("start")!;
  }

  get end() {
    return this.range.get("end")!;
  }

  loadRevenueByDateData(startDate: string, endDate: string): void {
    this.reportService.getRevenueByDateData(startDate, endDate).subscribe({
      next: (data) => {
        this.revenueByDate = data;
        this.datasource.data = data;

        this.receitaTotal = data.reduce(
          (total, item) => total + item.totalRevenue,
          0,
        );
      },
      error: (error: unknown) => {
        console.error("Erro ao carregar dados de receita por data:", error);
      },
    });
  }

  loadRevenueByCategoryData(): void {
    this.reportService.getRevenueByCategoryData().subscribe({
      next: (data) => {
        this.revenueByCategory = data;

        this.receitaTotal = data.reduce(
          (total, item) => total + item.totalRevenue,
          0,
        );
      },
      error: (error: unknown) => {
        console.error(
          "Erro ao carregar dados de receita por categoria:",
          error,
        );
      },
    });
  }

  generateRevenueByDateReport(): void {
    const start: Date | null = this.range.controls["start"].value;

    const end: Date | null = this.range.controls["end"].value;

    if ((start && !end) || (!start && end)) {
      alert("Atenção: Selecione as duas datas do intervalo.");
      return;
    }

    if (!start && !end) {
      this.sendReportRequest("", "");
      return;
    }

    if (start && end && start > end) {
      alert("Atenção: A data inicial não pode ser posterior à data final.");
      return;
    }

    const startFormatted = this.formatDate(start!);
    const endFormatted = this.formatDate(end!);

    this.sendReportRequest(startFormatted, endFormatted);
  }

  private sendReportRequest(startDate: string, endDate: string): void {
    this.reportService
      .generateRevenueByDateReport(startDate, endDate)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement("a");

          a.href = url;
          a.download = "relatorio_receitas_data.pdf";

          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error: unknown) => {
          console.error("Erro ao gerar relatório:", error);

          alert("Erro ao gerar relatório de receitas por data.");
        },
      });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  generateCategoriesReport(): void {
    this.reportService.generateCategoriesReport().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "relatorio_receitas_categorias.pdf";

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error: unknown) => {
        console.error("Erro ao gerar relatório:", error);

        alert("Erro ao gerar relatório de receitas por categoria.");
      },
    });
  }

  toggleView(): void {
    this.isReportsTotalView = !this.isReportsTotalView;

    if (this.isReportsTotalView) {
      this.loadRevenueByDateData("", "");
    } else {
      this.loadRevenueByCategoryData();
    }
  }
}
