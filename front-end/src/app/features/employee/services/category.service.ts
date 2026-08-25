import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../../../shared/models/category';
import { MOCK_CATEGORIES } from '../../../shared/mocks/category.mock';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: Category[] = MOCK_CATEGORIES.map(category => ({ ...category }));

  getAllCategories(): Observable<Category[]> {
    return of(this.categories.map(category => ({ ...category })));
  }

  addCategory(category: Category): Observable<Category> {
    const created = { ...category, id: this.nextId() };
    this.categories = [...this.categories, created];
    return of({ ...created });
  }

  getById(id: number): Observable<Category> {
    return of(this.categories.find(category => category.id === id) ?? { id, name: '', icon: '', active: false });
  }

  updateCategory(category: Category): Observable<Category> {
    this.categories = this.categories.map(current => current.id === category.id ? { ...category } : current);
    return of({ ...category });
  }

  deleteCategory(id: number): Observable<void> {
    this.categories = this.categories.filter(category => category.id !== id);
    return of(void 0);
  }

  private nextId(): number {
    return Math.max(0, ...this.categories.map(category => category.id)) + 1;
  }
}