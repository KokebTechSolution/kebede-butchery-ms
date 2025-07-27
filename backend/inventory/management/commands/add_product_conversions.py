from django.core.management.base import BaseCommand
from inventory.models import Product, ProductUnit, ProductMeasurement
from decimal import Decimal


class Command(BaseCommand):
    help = 'Add missing product conversions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product-name',
            type=str,
            help='Name of the product to add conversions for'
        )
        parser.add_argument(
            '--from-unit',
            type=str,
            help='From unit name (e.g., carton)'
        )
        parser.add_argument(
            '--to-unit',
            type=str,
            help='To unit name (e.g., bottle)'
        )
        parser.add_argument(
            '--conversion-factor',
            type=float,
            help='Conversion factor (e.g., 12 for 1 carton = 12 bottles)'
        )

    def handle(self, *args, **options):
        product_name = options['product_name']
        from_unit_name = options['from_unit']
        to_unit_name = options['to_unit']
        conversion_factor = options['conversion_factor']

        if not all([product_name, from_unit_name, to_unit_name, conversion_factor]):
            self.stdout.write(
                self.style.ERROR(
                    'Please provide all required arguments: --product-name, --from-unit, --to-unit, --conversion-factor'
                )
            )
            return

        try:
            # Get the product
            product = Product.objects.get(name__iexact=product_name)
            self.stdout.write(f"Found product: {product.name}")

            # Get the units
            from_unit = ProductUnit.objects.get(unit_name__iexact=from_unit_name)
            to_unit = ProductUnit.objects.get(unit_name__iexact=to_unit_name)
            self.stdout.write(f"From unit: {from_unit.unit_name}")
            self.stdout.write(f"To unit: {to_unit.unit_name}")

            # Check if conversion already exists
            existing = ProductMeasurement.objects.filter(
                product=product,
                from_unit=from_unit,
                to_unit=to_unit
            ).first()

            if existing:
                self.stdout.write(
                    self.style.WARNING(
                        f'Conversion already exists: {existing.from_unit.unit_name} -> {existing.to_unit.unit_name} = {existing.amount_per}'
                    )
                )
                update = input('Do you want to update it? (y/n): ')
                if update.lower() != 'y':
                    return
                existing.amount_per = Decimal(str(conversion_factor))
                existing.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated conversion: {from_unit.unit_name} -> {to_unit.unit_name} = {conversion_factor}'
                    )
                )
            else:
                # Create new conversion
                ProductMeasurement.objects.create(
                    product=product,
                    from_unit=from_unit,
                    to_unit=to_unit,
                    amount_per=Decimal(str(conversion_factor)),
                    is_default_sales_unit=False
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created conversion: {from_unit.unit_name} -> {to_unit.unit_name} = {conversion_factor}'
                    )
                )

        except Product.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Product "{product_name}" not found')
            )
        except ProductUnit.DoesNotExist as e:
            self.stdout.write(
                self.style.ERROR(f'Unit not found: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {e}')
            )

    def list_products(self):
        """List all products with their conversions"""
        products = Product.objects.all()
        for product in products:
            self.stdout.write(f"\nProduct: {product.name}")
            measurements = ProductMeasurement.objects.filter(product=product)
            if measurements:
                for m in measurements:
                    self.stdout.write(f"  {m.from_unit.unit_name} -> {m.to_unit.unit_name} = {m.amount_per}")
            else:
                self.stdout.write("  No conversions configured") 