from django.test import TestCase
from .models import Material, MaterialLog
from django.core.exceptions import ValidationError

class InventoryTestCase(TestCase):
    def setUp(self):
        self.material = Material.objects.create(
            name="Test Material",
            category="OTHER",
            quantity=10,
            min_threshold=5,
            price_per_unit=100
        )

    def test_material_creation(self):
        self.assertEqual(Material.objects.count(), 1)
        self.assertEqual(self.material.quantity, 10)

    def test_material_consumption(self):
        """Test that adding a CONSUMPTION log reduces the quantity."""
        log = MaterialLog.objects.create(
            material=self.material,
            change_qty=-3,
            log_type='CONSUMPTION'
        )
        self.material.refresh_from_db()
        self.assertEqual(self.material.quantity, 7)

    def test_negative_stock_prevention(self):
        """Test that negative stock triggers a validation error."""
        with self.assertRaises(ValidationError):
            MaterialLog.objects.create(
                material=self.material,
                change_qty=-15,
                log_type='CONSUMPTION'
            )
        self.material.refresh_from_db()
        self.assertEqual(self.material.quantity, 10) # Should not change
