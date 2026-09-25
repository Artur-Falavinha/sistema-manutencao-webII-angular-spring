import { Component, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {
  MatPaginator,
  MatPaginatorModule,
} from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { ReportService } from "../../../../core/services/report.service";
import { ToastService } from "../../../../core/services/toast.service";
import {
  RevenueByCategory,
  RevenueByDate,
} from "../../../../shared/models/reports.model";
import { dateToIso } from "../../../../shared/utils/birth-date-format";

@Component({
  selector: "app-reports-page",
  imports: [
    CommonModule,
    MatIcon,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: "./reports-page.component.html",
  styleUrl: "./reports-page.component.css",
})
export class ReportsPageComponent implements OnInit {
  isReportsTotalView = true;

  revenueByDate: RevenueByDate[] = [];
  revenueByCategory: RevenueByCategory[] = [];

  datasource = new MatTableDataSource<RevenueByDate>(this.revenueByDate);
  categoryDataSource = new MatTableDataSource<RevenueByCategory>(
    this.revenueByCategory,
  );

  range: FormGroup<{
    start: FormControl<Date | null>;
    end: FormControl<Date | null>;
  }>;
  receitaTotal = 0;

  displayedColumns: string[] = ["date", "totalRevenue"];
  categoryDisplayedColumns: string[] = ["categoryName", "totalRevenue"];

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator | undefined) {
    if (paginator) {
      this.datasource.paginator = paginator;
    }
  }

  constructor(
    private reportService: ReportService,
    private toast: ToastService,
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
    return this.range.controls.start;
  }

  get end() {
    return this.range.controls.end;
  }

  onViewChange(view: "date" | "category"): void {
    this.isReportsTotalView = view === "date";

    if (this.isReportsTotalView) {
      this.applyDateFilter();
      return;
    }

    this.loadRevenueByCategoryData();
  }

  applyDateFilter(): void {
    const range = this.readDateRange();

    if (range.error) {
      this.toast.warn("Atenção", range.error);
      return;
    }

    this.loadRevenueByDateData(range.startIso, range.endIso);
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
        this.toast.error("Erro", "Não foi possível carregar receitas por data.");
      },
    });
  }

  loadRevenueByCategoryData(): void {
    this.reportService.getRevenueByCategoryData().subscribe({
      next: (data) => {
        this.revenueByCategory = data;
        this.categoryDataSource.data = data;
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
        this.toast.error(
          "Erro",
          "Não foi possível carregar receitas por categoria.",
        );
      },
    });
  }

  generateRevenueByDateReport(): void {
    const range = this.readDateRange();

    if (range.error) {
      this.toast.warn("Atenção", range.error);
      return;
    }

    this.sendReportRequest(range.startIso, range.endIso);
  }

  private sendReportRequest(startDate: string, endDate: string): void {
    this.reportService
      .generateRevenueByDateReport(startDate, endDate)
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob, "relatorio_receitas_data.pdf");
          this.toast.success("Sucesso", "Relatório por data exportado.");
        },
        error: (error: unknown) => {
          console.error("Erro ao gerar relatório:", error);
          this.toast.error(
            "Erro",
            "Não foi possível gerar o relatório por data.",
          );
        },
      });
  }

  generateCategoriesReport(): void {
    this.reportService.generateCategoriesReport().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, "relatorio_receitas_categorias.pdf");
        this.toast.success("Sucesso", "Relatório por categoria exportado.");
      },
      error: (error: unknown) => {
        console.error("Erro ao gerar relatório:", error);
        this.toast.error(
          "Erro",
          "Não foi possível gerar o relatório por categoria.",
        );
      },
    });
  }

  private readDateRange(): {
    startIso: string;
    endIso: string;
    error: string | null;
  } {
    const start = this.start.value;
    const end = this.end.value;

    if ((start && !end) || (!start && end)) {
      return {
        startIso: "",
        endIso: "",
        error: "Selecione as duas datas do intervalo.",
      };
    }

    if (!start || !end) {
      return { startIso: "", endIso: "", error: null };
    }

    if (start > end) {
      return {
        startIso: "",
        endIso: "",
        error: "A data inicial não pode ser posterior à data final.",
      };
    }

    return {
      startIso: dateToIso(start),
      endIso: dateToIso(end),
      error: null,
    };
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
