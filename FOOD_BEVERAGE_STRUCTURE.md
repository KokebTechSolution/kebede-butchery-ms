# Food vs Beverage Structure Implementation

## Overview
This document explains the new structured approach to managing products in the Kebede Butchery Management System, specifically the distinction between Food and Beverage items.

## Problem Solved
Previously, the system had a confusing structure where:
- Products could be either "Food" or "Beverage" but the category management was not properly organized
- The ItemType model had a `category` field that was just a CharField
- The Category model was linked to ItemType, but the relationship was unclear
- Adding new products was confusing with unclear naming conventions

## New Structure

### 1. ItemType Model
- **Purpose**: Defines the main classification of products
- **Choices**: 
  - `food` - Food items including meat, vegetables, and prepared dishes
  - `beverage` - Beverage items including alcoholic and non-alcoholic drinks
- **Fields**:
  - `type_name`: Choice field with 'food' or 'beverage'
  - `description`: Text description of the item type
  - `created_at`, `updated_at`: Timestamps

### 2. Category Model
- **Purpose**: Sub-categories within each item type
- **Structure**: Each category belongs to a specific item type
- **Fields**:
  - `item_type`: ForeignKey to ItemType
  - `category_name`: Name of the category
  - `description`: Optional description
  - `is_active`: Boolean to enable/disable categories
  - `sort_order`: Integer for display ordering
  - `created_at`, `updated_at`: Timestamps

### 3. Pre-defined Categories

#### Food Categories:
1. **Meat** - Fresh meat and meat products
2. **Vegetables** - Fresh vegetables and greens
3. **Grains** - Rice, bread, and grain products
4. **Dairy** - Milk, cheese, and dairy products
5. **Spices** - Herbs, spices, and seasonings
6. **Prepared Food** - Ready-to-eat and prepared dishes

#### Beverage Categories:
1. **Soft Drinks** - Non-alcoholic carbonated and non-carbonated drinks
2. **Alcoholic Beer** - Beer and ale products
3. **Alcoholic Wine** - Wine and wine-based products
4. **Alcoholic Spirits** - Hard liquor and spirits
5. **Hot Beverages** - Coffee, tea, and hot drinks
6. **Juices** - Fresh and packaged fruit juices
7. **Energy Drinks** - Energy and sports drinks

## Implementation Steps

### 1. Database Migration
Run the migration to update the database structure:
```bash
python manage.py migrate inventory
```

### 2. Setup Initial Data
Run the management command to create initial categories:
```bash
python manage.py setup_food_beverage_structure
```

### 3. Frontend Updates
- **NewProduct Component**: Updated to properly handle Food vs Beverage selection
- **CategoryManager Component**: New component for managing categories
- **ProductListPage**: Added button to open CategoryManager

## Usage

### Adding New Products
1. Select Item Type (Food or Beverage)
2. Select Category from the filtered list
3. Enter product name, quantity, unit, and price
4. Submit to create product and stock

### Managing Categories
1. Click "🏷️ Manage Categories" button
2. Add new categories for Food or Beverage
3. Edit existing categories
4. Activate/deactivate categories
5. Reorder categories using sort_order

### Benefits
- **Clear Structure**: Food and Beverage are clearly separated
- **Easy Management**: Categories are organized by type
- **Scalable**: Easy to add new categories for each type
- **User-Friendly**: Clear interface for adding products
- **Consistent**: Standardized approach across the system

## API Endpoints

### ItemTypes
- `GET /api/inventory/itemtypes/` - List all item types
- `POST /api/inventory/itemtypes/` - Create new item type

### Categories
- `GET /api/inventory/categories/` - List all categories
- `POST /api/inventory/categories/` - Create new category
- `PATCH /api/inventory/categories/{id}/` - Update category
- `DELETE /api/inventory/categories/{id}/` - Delete category

## Future Enhancements
- **Sub-categories**: Add sub-categories within main categories
- **Category Icons**: Add icons for visual representation
- **Category Templates**: Pre-defined templates for common category types
- **Bulk Operations**: Import/export categories
- **Category Analytics**: Track usage and performance by category

## Troubleshooting

### Common Issues
1. **Migration Errors**: Ensure all previous migrations are applied
2. **Category Not Showing**: Check if category is active and has correct item_type
3. **Product Creation Fails**: Verify category and item_type exist and are active

### Debug Commands
```bash
# Check current item types
python manage.py shell
>>> from inventory.models import ItemType
>>> ItemType.objects.all()

# Check categories
>>> from inventory.models import Category
>>> Category.objects.all()

# Check food categories
>>> Category.objects.filter(item_type__type_name='food')

# Check beverage categories
>>> Category.objects.filter(item_type__type_name='beverage')
```
