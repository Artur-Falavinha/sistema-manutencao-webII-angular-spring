import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Category } from '../../../../shared/models/category';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { DialogShellComponent } from '../../../../shared/components/dialog-shell/dialog-shell.component';
import {
  CATEGORY_ICON_OPTIONS,
  normalizeCategoryIcon,
} from '../../../../shared/constants/category-icon-options';

@Component({
  selector: 'app-new-category-modal',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    DialogShellComponent,
  ],
  templateUrl: './new-category-modal.component.html',
  styleUrl: './new-category-modal.component.css'
})
export class NewCategoryModalComponent implements OnInit{
  category: Category = {id: 0, name: '', icon: '', active: true};
  readonly iconOptions = CATEGORY_ICON_OPTIONS;

  constructor(
    private readonly dialogRef: MatDialogRef<NewCategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) readonly editingCategory: Category | null,
  ) {}

  ngOnInit(): void {
    if (this.editingCategory) {
      this.category = {
        ...this.editingCategory,
        icon: normalizeCategoryIcon(this.editingCategory.icon),
      };
    }
  }

  onSubmit(form: NgForm) : void{
    if (form.valid) {
      this.dialogRef.close({
        ...this.category,
        icon: normalizeCategoryIcon(this.category.icon),
      });
    }
  }

  confirmClose(): void {
      this.dialogRef.close();
  }

}
