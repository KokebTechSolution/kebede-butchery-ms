# Generated manually to fix foreign key constraint

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_initial'),
        ('menu', '0002_update_category_foreign_key'),
    ]

    operations = [
        # Drop the old foreign key constraint
        migrations.RunSQL(
            sql="""
            ALTER TABLE menu_menuitem 
            DROP CONSTRAINT IF EXISTS menu_menuitem_category_id_af353a3b_fk_menu_menucategory_id;
            """,
            reverse_sql="""
            ALTER TABLE menu_menuitem 
            ADD CONSTRAINT menu_menuitem_category_id_af353a3b_fk_menu_menucategory_id 
            FOREIGN KEY (category_id) REFERENCES menu_menucategory(id);
            """
        ),
        
        # Add the new foreign key constraint to inventory_category
        migrations.RunSQL(
            sql="""
            ALTER TABLE menu_menuitem 
            ADD CONSTRAINT menu_menuitem_category_id_fk_inventory_category_id 
            FOREIGN KEY (category_id) REFERENCES inventory_category(id);
            """,
            reverse_sql="""
            ALTER TABLE menu_menuitem 
            DROP CONSTRAINT IF EXISTS menu_menuitem_category_id_fk_inventory_category_id;
            """
        ),
    ] 