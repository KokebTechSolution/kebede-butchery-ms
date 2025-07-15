# menu/urls.py
from rest_framework.routers import DefaultRouter
from .views import MenuViewSet, MenuItemViewSet
from .views import MenuSectionViewSet

router = DefaultRouter()
router.register('menus', MenuViewSet)        
router.register('menuitems', MenuItemViewSet)
router.register(r'menusections', MenuSectionViewSet)

urlpatterns = router.urls
