import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReportsPageComponent } from "./reports-page.component";
import { ReportService } from "../../../../core/services/report.service";
import { ToastService } from "../../../../core/services/toast.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { provideNativeDateAdapter } from "@angular/material/core";
import { of } from "rxjs";

describe("ReportsPageComponent", () => {
  let component: ReportsPageComponent;
  let fixture: ComponentFixture<ReportsPageComponent>;

  beforeEach(async () => {
    // Mock do serviço de relatórios para evitar chamadas HTTP reais no ngOnInit.
    const reportServiceMock = {
      getRevenueByDateData: jasmine
        .createSpy("getRevenueByDateData")
        .and.returnValue(of([])),
      getRevenueByCategoryData: jasmine
        .createSpy("getRevenueByCategoryData")
        .and.returnValue(of([])),
      generateRevenueByDateReport: jasmine
        .createSpy("generateRevenueByDateReport")
        .and.returnValue(of(new Blob())),
      generateCategoriesReport: jasmine
        .createSpy("generateCategoriesReport")
        .and.returnValue(of(new Blob())),
    };

    const toastServiceMock = {
      success: jasmine.createSpy("success"),
      error: jasmine.createSpy("error"),
      warn: jasmine.createSpy("warn"),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent, BrowserAnimationsModule],
      providers: [
        provideNativeDateAdapter(),
        { provide: ReportService, useValue: reportServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("deve ser instanciado corretamente", () => {
    expect(component).toBeTruthy();
  });
});
