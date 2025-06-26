# menu/urls.py
from rest_framework.routers import DefaultRouter
from .views import MenuViewSet, MenuItemViewSet

router = DefaultRouter()
router.register('menus', MenuViewSet)          # ✅ This is the endpoint your UI is calling.
router.register('menuitems', MenuItemViewSet)

urlpatterns = router.urls
