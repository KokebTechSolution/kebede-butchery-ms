# menu/urls.py
from rest_framework.routers import DefaultRouter
from .views import MenuViewSet, MenuItemViewSet
from .views import MenuSectionViewSet
from .views import MenuCategoryViewSet
router = DefaultRouter()
router.register(r'menucategories', MenuCategoryViewSet) 
router.register('menus', MenuViewSet)        
router.register('menuitems', MenuItemViewSet)
router.register(r'menusections', MenuSectionViewSet)

urlpatterns = router.urls
