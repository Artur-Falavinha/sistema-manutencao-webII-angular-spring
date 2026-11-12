import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DialogShellComponent } from '../../../../shared/components/dialog-shell/dialog-shell.component';
import { Component, Input, Output, EventEmitter, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Category } from '../../../../shared/models/category';

@Component({
  selector: 'app-new-category-modal',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, DialogShellComponent],
  templateUrl: './new-category-modal.component.html',
  styleUrl: './new-category-modal.component.css'
})
export class NewCategoryModalComponent implements OnInit{
  @Input() editingCategory: Category | null = null;
  @Output() submitted = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  category: Category = {id: 0, name: '', icon: '', active: true};

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: Category | null) {}

  ngOnInit(): void {
    if (this.data) this.editingCategory = this.data;
    if (this.editingCategory) {
      this.category = { ...this.editingCategory };
    }
  }

  onSubmit(form: NgForm) : void{
    if (form.valid && this.category.name.trim() && this.category.icon.trim()) {
      this.submitted.emit(this.category);
    }
  }

  confirmClose(): void {
      this.closeModal.emit();
  }

}
