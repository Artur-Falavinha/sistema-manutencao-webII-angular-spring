import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ReportService } from '../../../../core/services/report.service';
import { RevenueByCategory, RevenueByDate } from '../../../../shared/models/reports.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-reports-page',
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
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
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

  displayedColumns: string[] = ['date', 'totalRevenue'];

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
    this.loadRevenueByDateData('', '');
  }

  get start() {
    return this.range.get('start')!;
  }

  get end() {
    return this.range.get('end')!;
  }

  loadRevenueByDateData(startDate: string, endDate: string) {
    this.reportService.getRevenueByDateData(startDate, endDate).subscribe({
      next: (data) => {
        this.datasource.data = data;
      },
      error: (error: unknown) => {
        console.error('Erro ao carregar dados de receita por data:', error);
      },
    });
  }

  loadRevenueByCategoryData() {
    this.reportService.getRevenueByCategoryData().subscribe({
      next: (data) => {
        this.revenueByCategory = data;
      },
      error: (error: unknown) => {
        console.error(
          'Erro ao carregar dados de receita por categoria:',
          error,
        );
      },
    });
  }

  generateRevenueByDateReport() {
    const start: Date | null = this.range.controls['start'].value;
    const end: Date | null = this.range.controls['end'].value;

    if ((start && !end) || (!start && end)) {
      alert('Atenção: Selecione as duas datas do intervalo.');
      return;
    }

    alert('Sucesso: Download do relatório de receitas por data simulado.');
  }

  generateCategoriesReport() {
    alert('Sucesso: Download do relatório de receitas por categoria simulado.');
  }

  toggleView() {
    this.isReportsTotalView = !this.isReportsTotalView;
  }
}
