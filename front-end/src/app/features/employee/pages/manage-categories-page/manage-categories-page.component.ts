import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../../../shared/models/category';
import { NewCategoryModalComponent } from '../../components/new-category-modal/new-category-modal.component';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { WarningDialogComponent } from '../../../../shared/components/warning-dialog/warning-dialog.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-manage-categories-page',
  imports: [CommonModule, MatIcon, MatButtonModule],
  templateUrl: './manage-categories-page.component.html',
  styleUrls: ['./manage-categories-page.component.css'],
})
export class ManageCategoriesPageComponent implements OnInit {
  categories: Category[] = [];

  constructor(private categoryService: CategoryService, private dialog: MatDialog, private toast: ToastService) {}

  ngOnInit(): void {
    this.getAllCategories();
  }

  getAllCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data: Category[]) => {
        (this.categories = data);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias', err);
        this.toast.error('Erro', 'Erro ao carregar categorias: ' + err);
      }
    });
  }

  openNewCategoryModal(): void {
    this.openCategoryModal();
  }

  editCategory(category: Category): void {
    this.openCategoryModal(category);
  }

  private openCategoryModal(category?: Category): void {
    const isEditing = Boolean(category);
    const dialogRef = this.dialog.open(NewCategoryModalComponent, {
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      data: category ?? null,
    });

    dialogRef.afterClosed().subscribe((result: Category | undefined) => {
      if (result) {
        this.onModalSubmit(result, isEditing);
      }
    });
  }

  private onModalSubmit(category: Category, isEditing: boolean): void {
    if (isEditing) {
      this.categoryService.updateCategory(category).subscribe({
        next: () => {
          this.getAllCategories();
          this.toast.success('Sucesso', 'Categoria atualizada com sucesso');
        },
        error: (err: unknown) => {
          this.toast.error('Erro', 'Erro ao atualizar categoria: ' + err);
          console.error('Erro ao atualizar categoria', err);
        } 
      });
    } else {
      this.categoryService.addCategory(category).subscribe({
        next: () => {
          this.getAllCategories();
          this.toast.success('Sucesso', 'Categoria adicionada com sucesso');
        },
        error: (err: unknown) => {
          this.toast.error('Erro', 'Erro ao adicionar categoria: ' + err);
          console.error('Erro ao atualizar categoria', err);
        }
      });
    }
  }

  deleteCategory(id: number): void {
    const dialogRef = this.dialog.open(WarningDialogComponent, {
      data: {
        title: 'Confirmar exclusão',
        message: 'Tem certeza que deseja excluir esta categoria?',
      },
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result) {
        this.categoryService.deleteCategory(id).subscribe(() => {
          this.getAllCategories();
          this.toast.success('Sucesso', 'Categoria excluída com sucesso');
        });
      }
    });
  }
}
