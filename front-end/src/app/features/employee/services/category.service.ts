import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../../../shared/models/category';
import { MOCK_CATEGORIES } from '../../../shared/mocks/category.mock';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  getAllCategories(): Observable<Category[]> {
    return of(MOCK_CATEGORIES);
  }
}
