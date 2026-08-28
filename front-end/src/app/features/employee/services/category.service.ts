import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../../../shared/models/category';
import { MOCK_CATEGORIES } from '../../../shared/mocks/category.mock';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly formIcons = ['notebook', 'desktop', 'impressora', 'mouse', 'teclado'];

  getAllCategories(): Observable<Category[]> {
    return of(this.getCategoriesForForm());
  }

  addCategory(category: Category): Observable<Category> {
    return of({ ...category });
  }

  getById(id: number): Observable<Category> {
    const category = this.getCategoriesForForm().find(item => item.id === id);
    return of(category ? { ...category } : { id, name: '', icon: '', active: false });
  }

  updateCategory(category: Category): Observable<Category> {
    return of({ ...category });
  }

  deleteCategory(_id: number): Observable<void> {
    return of(void 0);
  }

  private getCategoriesForForm(): Category[] {
    return MOCK_CATEGORIES.map((category, index) => ({
      ...category,
      icon: this.formIcons[index] ?? 'desktop'
    }));
  }
}
