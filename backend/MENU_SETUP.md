# Menu Categories Setup Guide

This guide explains how to set up menu categories for the Kebede Butchery system.

## Overview

The menu management system uses **MenuCategory** models to organize menu items. Categories are automatically populated from the backend and cannot be created through the frontend interface.

**Important**: The waiter interface displays only two main categories: **FOOD** and **DRINK (beverage)**, regardless of the detailed subcategories used in the backend.

## Setup Options

### Option 1: Automatic Setup (Recommended)

Run the Django management command:

```bash
cd backend
python manage.py populate_menu_categories
```

This command will:
- Check for existing inventory categories and create menu categories based on them
- If no inventory categories exist, create default menu categories
- Skip categories that already exist

### Option 2: Manual Setup Script

Run the setup script directly:

```bash
cd backend
python setup_menu_categories.py
```

### Option 3: Django Admin

1. Access Django admin panel
2. Navigate to Menu > Menu Categories
3. Add categories manually

## Default Categories

If no inventory categories exist, the system will create these default categories:

**Food Categories (11):**
- Main Dishes
- Appetizers
- Desserts
- Snacks
- Sides
- Salads
- Soups
- Grilled Items
- Fried Items
- Pasta & Rice
- Bread & Pastries

**Beverage Categories (11):**
- Alcoholic Drinks
- Non-Alcoholic Drinks
- Hot Drinks
- Cold Drinks
- Juices
- Smoothies
- Coffee & Tea
- Wine & Spirits
- Beer & Cider
- Soft Drinks
- Water

## Waiter Interface Display

The waiter's menu interface simplifies the display to only two main categories:

| Backend Category | Waiter Display |
|------------------|----------------|
| All Food Categories | **FOOD** |
| All Beverage Categories | **DRINK** |

**Example:**
- Backend: "Main Dishes", "Appetizers", "Desserts" → Waiter sees: **FOOD**
- Backend: "Alcoholic Drinks", "Coffee & Tea", "Juices" → Waiter sees: **DRINK**

## Category Mapping

When creating categories from inventory categories, the system maps them as follows:

| Inventory Category Type | Menu Category |
|------------------------|---------------|
| Beverage + Alcohol-related | Alcoholic Drinks |
| Beverage + Non-alcohol | Non-Alcoholic Drinks |
| Beverage + Other | Beverages |
| Food + Main/Entree | Main Dishes |
| Food + Appetizer/Starter | Appetizers |
| Food + Dessert/Sweet | Desserts |
| Food + Salad/Vegetable | Salads |
| Food + Soup/Broth | Soups |
| Food + Bread/Pastry | Bread & Pastries |
| Food + Other | Main Dishes |

## Frontend Behavior

### Menu Management (Admin)
- Categories are automatically filtered based on item type (food vs beverage)
- Users cannot create new categories through the frontend
- If no categories exist, users will see a helpful message with setup instructions
- Categories are read-only in the frontend interface

### Waiter Interface
- **Simplified Display**: Only shows "FOOD" and "DRINK" tabs
- **No Subcategories**: All food items appear under "FOOD", all beverages under "DRINK"
- **Clean Interface**: Removes complexity for waiters while maintaining backend organization

## Troubleshooting

### No Categories Available

If you see "No menu categories available" in the frontend:

1. Run the setup command: `python manage.py populate_menu_categories`
2. Check Django admin to verify categories were created
3. Refresh the frontend page

### Categories Not Loading

If categories don't load in the frontend:

1. Check the backend API endpoint: `GET /menu/menucategories/`
2. Verify the menu app is properly installed
3. Check Django logs for any errors

### Permission Issues

If you get permission errors:

1. Ensure you're running the command from the backend directory
2. Check that Django is properly configured
3. Verify database migrations are applied

## Maintenance

- Categories can be managed through Django admin
- New categories can be added via Django admin or management commands
- Existing categories can be edited or deleted through Django admin
- The system will automatically filter categories based on item type
- Waiter interface will always show simplified FOOD/DRINK display regardless of backend categories 