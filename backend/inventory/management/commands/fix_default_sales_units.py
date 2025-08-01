from django.core.management.base import BaseCommand
from inventory.models import Product, ProductMeasurement, ProductUnit
from decimal import Decimal


class Command(BaseCommand):
    help = 'Fix products missing default sales units by setting their base unit as default'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Get all products
        products = Product.objects.all()
        fixed_count = 0
        skipped_count = 0
        
        self.stdout.write(f"Checking {products.count()} products for missing default sales units...")
        
        for product in products:
            # Check if product has a base unit
            if not product.base_unit:
                self.stdout.write(f"⚠ {product.name} - No base unit defined, skipping")
                skipped_count += 1
                continue
            
            # Check if product has the base unit as default sales unit
            has_base_as_default = ProductMeasurement.objects.filter(
                product=product,
                from_unit=product.base_unit,
                to_unit=product.base_unit,
                is_default_sales_unit=True
            ).exists()
            
            if has_base_as_default:
                self.stdout.write(f"✓ {product.name} - Base unit ({product.base_unit.unit_name}) is already default sales unit")
                skipped_count += 1
                continue
            
            # Check if there are any other default sales units
            other_defaults = ProductMeasurement.objects.filter(
                product=product,
                is_default_sales_unit=True
            ).exclude(from_unit=product.base_unit, to_unit=product.base_unit)
            
            if other_defaults.exists():
                self.stdout.write(f"⚠ {product.name} - Has other default sales unit, will update to base unit")
            
            # Create or update base unit as default sales unit
            if not dry_run:
                try:
                    # Remove default flag from other measurements
                    ProductMeasurement.objects.filter(
                        product=product,
                        is_default_sales_unit=True
                    ).update(is_default_sales_unit=False)
                    
                    # Check if self-conversion already exists
                    existing = ProductMeasurement.objects.filter(
                        product=product,
                        from_unit=product.base_unit,
                        to_unit=product.base_unit
                    ).first()
                    
                    if existing:
                        # Update existing conversion to be default
                        existing.is_default_sales_unit = True
                        existing.save()
                        self.stdout.write(f"✓ {product.name} - Updated existing conversion to default sales unit")
                    else:
                        # Create new self-conversion as default
                        ProductMeasurement.objects.create(
                            product=product,
                            from_unit=product.base_unit,
                            to_unit=product.base_unit,
                            amount_per=Decimal('1.0'),
                            is_default_sales_unit=True
                        )
                        self.stdout.write(f"✓ {product.name} - Created default sales unit: {product.base_unit.unit_name}")
                    
                    fixed_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ {product.name} - Error: {e}"))
            else:
                self.stdout.write(f"Would fix {product.name} - Set {product.base_unit.unit_name} as default sales unit")
                fixed_count += 1
        
        # Summary
        self.stdout.write("")
        self.stdout.write("=" * 50)
        self.stdout.write("SUMMARY:")
        self.stdout.write(f"Products checked: {products.count()}")
        self.stdout.write(f"Products fixed: {fixed_count}")
        self.stdout.write(f"Products skipped: {skipped_count}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes were made"))
        else:
            self.stdout.write(self.style.SUCCESS("Default sales units have been set for all products!")) 