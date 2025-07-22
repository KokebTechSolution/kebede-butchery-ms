from .models import ProductMeasurement

def deduct_stock(product, unit_type, quantity):
    """
    Deducts stock for a product, handling conversions using ProductMeasurement.
    Returns True if successful, False if not enough stock or missing measurement.
    """
    from .models import Stock
    from decimal import Decimal
    stock = Stock.objects.filter(product=product).first()
    if not stock:
        return False
    qty = Decimal(quantity)
    # Example for carton
    if unit_type == 'carton':
        carton_measurement = product.measurements.filter(measurement_type='carton').first()
        if carton_measurement is None:
            return False  # Or raise Exception('No carton measurement defined for this product.')
        bottles_per_carton = carton_measurement.amount_per
        if stock.carton_quantity < qty:
            return False
        stock.carton_quantity -= qty
        stock.bottle_quantity -= qty * bottles_per_carton
        stock.save()
        return True
    # Example for bottle
    elif unit_type == 'bottle':
        bottle_measurement = product.measurements.filter(measurement_type='bottle').first()
        bottles_per_carton = product.measurements.filter(measurement_type='carton').first()
        if bottle_measurement is None and bottles_per_carton is None:
            return False
        if stock.bottle_quantity < qty:
            # Try to break cartons if possible
            if bottles_per_carton is None:
                return False
            bottles_per_carton = bottles_per_carton.amount_per
            needed = qty - stock.bottle_quantity
            cartons_needed = (needed + bottles_per_carton - 1) // bottles_per_carton
            if stock.carton_quantity < cartons_needed:
                return False
            stock.carton_quantity -= cartons_needed
            stock.bottle_quantity += cartons_needed * bottles_per_carton
        stock.bottle_quantity -= qty
        stock.save()
        return True
    # Example for unit
    elif unit_type == 'unit':
        unit_measurement = product.measurements.filter(measurement_type='unit').first()
        bottle_measurement = product.measurements.filter(measurement_type='bottle').first()
        bottles_per_carton = product.measurements.filter(measurement_type='carton').first()
        if unit_measurement is None and bottle_measurement is None and bottles_per_carton is None:
            return False
        shoots_needed = qty
        shoots_available = stock.unit_quantity
        shoots_per_bottle = bottle_measurement.amount_per if bottle_measurement else None
        if shoots_available >= shoots_needed:
            stock.unit_quantity -= shoots_needed
            stock.save()
            return True
        else:
            # Use all unit_quantity first
            shoots_to_take = shoots_available
            shoots_still_needed = shoots_needed - shoots_to_take
            bottles_available = stock.bottle_quantity
            shoots_from_bottles = bottles_available * Decimal(shoots_per_bottle) if shoots_per_bottle else 0
            if shoots_to_take + shoots_from_bottles >= shoots_needed:
                # Use bottles
                bottles_to_use = int((shoots_still_needed + Decimal(shoots_per_bottle) - 1) // Decimal(shoots_per_bottle)) if shoots_per_bottle else 0
                if bottles_to_use > bottles_available:
                    bottles_to_use = bottles_available
                stock.bottle_quantity -= bottles_to_use
                stock.unit_quantity = Decimal('0.00') + (shoots_to_take + bottles_to_use * Decimal(shoots_per_bottle) - shoots_needed)
                stock.save()
                return True
            else:
                # Try to break cartons
                if bottles_per_carton is None or shoots_per_bottle is None:
                    return False
                bottles_from_cartons = stock.carton_quantity * bottles_per_carton.amount_per
                shoots_from_cartons = bottles_from_cartons * Decimal(shoots_per_bottle)
                total_shoots = shoots_to_take + shoots_from_bottles + shoots_from_cartons
                if total_shoots < shoots_needed:
                    return False
                # Use all bottles, then break cartons
                shoots_still_needed -= shoots_from_bottles
                bottles_to_use = bottles_available
                cartons_to_use = int((shoots_still_needed + Decimal(shoots_per_bottle * bottles_per_carton.amount_per) - 1) // Decimal(shoots_per_bottle * bottles_per_carton.amount_per))
                if cartons_to_use > stock.carton_quantity:
                    cartons_to_use = stock.carton_quantity
                stock.carton_quantity -= cartons_to_use
                stock.bottle_quantity = bottles_available + cartons_to_use * bottles_per_carton.amount_per - bottles_to_use - (shoots_still_needed // Decimal(shoots_per_bottle))
                stock.unit_quantity = Decimal('0.00') + (total_shoots - shoots_needed)
                stock.save()
                return True
    # Example for litre
    elif unit_type == 'litre':
        litre_measurement = product.measurements.filter(measurement_type='litre').first()
        if litre_measurement is None:
            return False
        if stock.unit_quantity < qty:
            return False
        stock.unit_quantity -= qty
        stock.save()
        return True
    return False 