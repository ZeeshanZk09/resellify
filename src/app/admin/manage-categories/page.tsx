'use client';

import { useEffect, useState } from 'react';

import {
  getCategories,
  getAllCategoriesFlat,
  TGetAllCategories,
} from '@/actions/category/category';
import AddCategoryGroup from '@/domains/admin/components/category/addCategoryGroup';
import RowCatGroup from '@/domains/admin/components/category/rowGroup';

export default function ManageCategoriesPage() {
  const [parentCategories, setParentCategories] = useState<
    (TGetAllCategories & { parentId?: string | null })[]
  >([]);
  const [allCategories, setAllCategories] = useState<
    (TGetAllCategories & { parentId?: string | null })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch parent categories
      const parentResult = await getCategories();
      if (parentResult.res) {
        setParentCategories(
          parentResult.res as (TGetAllCategories & { parentId?: string | null })[]
        );
      }

      // Fetch all categories (including subcategories) for the RowCatGroup component
      // We need all categories to properly filter subcategories
      const allCategoriesResult = await getAllCategoriesFlat();
      if (allCategoriesResult.res) {
        setAllCategories(
          allCategoriesResult.res as (TGetAllCategories & { parentId?: string | null })[]
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleReset = () => {
    fetchCategories();
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <span>Loading categories...</span>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-4'>Manage Categories</h1>
        <AddCategoryGroup onReset={handleReset} />
      </div>

      <div className='flex flex-col gap-4'>
        {parentCategories.length > 0 ? (
          parentCategories.map((category) => (
            <RowCatGroup
              key={category.id}
              data={category}
              categories={allCategories}
              onReset={handleReset}
            />
          ))
        ) : (
          <div className='text-center py-8 text-gray-500'>
            No categories found. Create your first category group above.
          </div>
        )}
      </div>
    </div>
  );
}
