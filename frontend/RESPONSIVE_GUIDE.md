# Responsive Design Guide

This guide explains how to use the responsive components and utilities to make your application work seamlessly across mobile devices, tablets, and desktops.

## Overview

The project now includes a comprehensive responsive design system with the following features:

- **Mobile-first design** with progressive enhancement
- **Touch-friendly interfaces** with proper touch targets
- **Responsive layouts** that adapt to different screen sizes
- **Accessible components** with proper ARIA labels and keyboard navigation
- **Performance optimized** with efficient CSS and minimal JavaScript

## Breakpoints

The responsive system uses the following breakpoints:

- **xs**: 475px and up
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up
- **2xl**: 1536px and up

## Core Components

### 1. ResponsiveLayout

The main layout component that provides responsive sidebar, header, and content areas.

```jsx
import ResponsiveLayout from '../components/ResponsiveLayout';

function MyDashboard() {
  const header = <ResponsiveNavbar title="Dashboard" user={user} />;
  const sidebar = <SidebarContent />;

  return (
    <ResponsiveLayout
      header={header}
      sidebar={sidebar}
      showSidebar={true}
      showHeader={true}
    >
      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Your content here */}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
```

### 2. ResponsiveNavbar

A responsive navigation bar that adapts to mobile and desktop views.

```jsx
import ResponsiveNavbar from '../components/ResponsiveNavbar';

<ResponsiveNavbar
  title="Dashboard"
  user={user}
  onLogout={handleLogout}
  notifications={notifications}
  onNotificationClick={handleNotificationClick}
/>
```

### 3. ResponsiveTable

A table component that can switch between table and card views for better mobile experience.

```jsx
import ResponsiveTable from '../components/ResponsiveTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }
];

const data = [
  { name: 'John Doe', email: 'john@example.com', role: 'Admin' }
];

<ResponsiveTable
  columns={columns}
  data={data}
  searchable={true}
  sortable={true}
  cardView={false}
  showCardViewToggle={true}
  onRowClick={(item) => console.log(item)}
/>
```

### 4. ResponsiveForm

A form component with mobile-optimized inputs and layout.

```jsx
import ResponsiveForm from '../components/ResponsiveForm';

<ResponsiveForm
  title="Add New User"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitText="Save User"
  cancelText="Cancel"
>
  <ResponsiveForm.Field label="Name" required>
    <ResponsiveForm.Input
      placeholder="Enter name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </ResponsiveForm.Field>
  
  <ResponsiveForm.Field label="Role">
    <ResponsiveForm.Select
      options={[
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' }
      ]}
      value={role}
      onChange={(e) => setRole(e.target.value)}
    />
  </ResponsiveForm.Field>
</ResponsiveForm>
```

### 5. ResponsiveModal

A modal component that works well on mobile devices.

```jsx
import ResponsiveModal from '../components/ResponsiveModal';

<ResponsiveModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex space-x-2 mt-4">
    <button className="mobile-button">Confirm</button>
    <button className="mobile-button-secondary">Cancel</button>
  </div>
</ResponsiveModal>
```

### 6. MobileBottomNav

Bottom navigation for mobile devices.

```jsx
import MobileBottomNav from '../components/MobileBottomNav';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { key: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
  { key: 'profile', label: 'Profile', icon: <User size={20} /> }
];

<MobileBottomNav
  currentPage={currentPage}
  onNavigate={setCurrentPage}
  items={navItems}
/>
```

### 7. ResponsiveDashboard

A comprehensive dashboard component that combines layout, navigation, and content.

```jsx
import ResponsiveDashboard from '../components/ResponsiveDashboard';

const sidebarItems = [
  { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { key: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
  { key: 'users', label: 'Users', icon: <Users size={20} /> }
];

<ResponsiveDashboard
  title="Admin Dashboard"
  user={user}
  onLogout={handleLogout}
  sidebarItems={sidebarItems}
>
  <ResponsiveDashboard.Grid cols={4}>
    <ResponsiveDashboard.Card
      title="Total Revenue"
      value="$12,345"
      subtitle="This month"
      icon={<DollarSign size={24} />}
      trend="up"
      trendValue="12%"
    />
    <ResponsiveDashboard.Card
      title="Orders"
      value="156"
      subtitle="This month"
      icon={<ShoppingCart size={24} />}
    />
  </ResponsiveDashboard.Grid>
  
  <ResponsiveDashboard.Section title="Recent Orders">
    <ResponsiveTable columns={columns} data={orders} />
  </ResponsiveDashboard.Section>
</ResponsiveDashboard>
```

## CSS Utilities

### Mobile-First Classes

```css
/* Responsive text sizes */
.text-responsive-xs  /* xs: 0.75rem, sm: 0.875rem, md: 1rem */
.text-responsive-sm  /* sm: 0.875rem, md: 1rem, lg: 1.125rem */
.text-responsive-base /* md: 1rem, lg: 1.125rem, xl: 1.25rem */
.text-responsive-lg  /* lg: 1.125rem, xl: 1.25rem, 2xl: 1.5rem */
.text-responsive-xl  /* xl: 1.25rem, 2xl: 1.5rem, 3xl: 1.875rem */

/* Responsive spacing */
.spacing-responsive  /* p-4 sm:p-6 lg:p-8 */
.gap-responsive     /* gap-2 sm:gap-4 lg:gap-6 */
.margin-responsive  /* m-2 sm:m-4 lg:m-6 */
```

### Component Classes

```css
/* Layout */
.mobile-container    /* Responsive container with padding */
.mobile-card        /* Card with mobile-optimized styling */
.mobile-button      /* Primary button with touch-friendly sizing */
.mobile-button-secondary /* Secondary button */
.mobile-input       /* Input with mobile-optimized styling */
.mobile-table       /* Table with responsive design */
.mobile-nav         /* Bottom navigation for mobile */
.mobile-sidebar     /* Collapsible sidebar for mobile */
.mobile-modal       /* Modal optimized for mobile */

/* Dashboard */
.dashboard-container /* Main dashboard container */
.dashboard-header   /* Dashboard header */
.dashboard-content  /* Dashboard content area */
.dashboard-card     /* Dashboard card component */
.dashboard-stats    /* Stats grid layout */
.dashboard-stat-card /* Individual stat card */

/* Forms */
.form-group         /* Form field group */
.form-label         /* Form label */
.form-input         /* Form input (same as mobile-input) */
.form-select        /* Form select */
.form-textarea      /* Form textarea */
```

## Best Practices

### 1. Mobile-First Development

Always start with mobile design and progressively enhance for larger screens:

```jsx
// Good: Mobile-first approach
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Avoid: Desktop-first approach
<div className="grid grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 gap-4">
  {/* Content */}
</div>
```

### 2. Touch-Friendly Design

Ensure all interactive elements are at least 44px in height:

```jsx
// Good: Touch-friendly button
<button className="mobile-button px-4 py-3">
  Click me
</button>

// Avoid: Small touch targets
<button className="px-2 py-1">
  Click me
</button>
```

### 3. Responsive Images

Use responsive images that scale appropriately:

```jsx
<img 
  src="image.jpg" 
  alt="Description"
  className="w-full h-auto object-cover"
/>
```

### 4. Flexible Layouts

Use flexbox and grid for responsive layouts:

```jsx
// Flexible card layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id} className="mobile-card">
      {/* Card content */}
    </div>
  ))}
</div>
```

### 5. Progressive Enhancement

Enhance functionality for larger screens:

```jsx
// Show sidebar on desktop, hide on mobile
<div className="hidden lg:block">
  <Sidebar />
</div>

// Show mobile menu button on mobile
<div className="lg:hidden">
  <MobileMenuButton />
</div>
```

## Testing Responsive Design

### 1. Browser DevTools

Use browser developer tools to test different screen sizes:
- Chrome DevTools: Device toolbar
- Firefox DevTools: Responsive design mode
- Safari: Develop > Enter Responsive Design Mode

### 2. Real Devices

Test on actual devices:
- Android phones and tablets
- iOS phones and tablets
- Different screen sizes and orientations

### 3. Performance Testing

Ensure good performance on mobile:
- Use Lighthouse for performance audits
- Test on slower network connections
- Optimize images and assets

## Common Patterns

### 1. Dashboard Layout

```jsx
<ResponsiveDashboard
  title="My Dashboard"
  user={user}
  sidebarItems={sidebarItems}
>
  <ResponsiveDashboard.Grid cols={4}>
    <ResponsiveDashboard.Card title="Revenue" value="$10,000" />
    <ResponsiveDashboard.Card title="Orders" value="150" />
    <ResponsiveDashboard.Card title="Users" value="1,200" />
    <ResponsiveDashboard.Card title="Growth" value="12%" />
  </ResponsiveDashboard.Grid>
  
  <ResponsiveDashboard.Section title="Recent Activity">
    <ResponsiveTable columns={columns} data={data} />
  </ResponsiveDashboard.Section>
</ResponsiveDashboard>
```

### 2. Form Layout

```jsx
<ResponsiveForm title="Add New Item" onSubmit={handleSubmit}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ResponsiveForm.Field label="Name" required>
      <ResponsiveForm.Input placeholder="Enter name" />
    </ResponsiveForm.Field>
    
    <ResponsiveForm.Field label="Category">
      <ResponsiveForm.Select options={categories} />
    </ResponsiveForm.Field>
  </div>
  
  <ResponsiveForm.Field label="Description">
    <ResponsiveForm.Textarea rows={4} />
  </ResponsiveForm.Field>
</ResponsiveForm>
```

### 3. Table with Actions

```jsx
<ResponsiveTable
  columns={columns}
  data={data}
  searchable={true}
  sortable={true}
  cardView={false}
>
  <div className="flex space-x-2">
    <button className="mobile-button">Edit</button>
    <button className="mobile-button-secondary">Delete</button>
  </div>
</ResponsiveTable>
```

## Troubleshooting

### Common Issues

1. **Sidebar not working on mobile**
   - Ensure ResponsiveLayout is being used
   - Check that mobile detection is working

2. **Tables not responsive**
   - Use ResponsiveTable component
   - Enable card view for mobile
   - Add horizontal scrolling for complex tables

3. **Forms not mobile-friendly**
   - Use ResponsiveForm components
   - Ensure proper input sizing (16px minimum)
   - Add proper spacing between fields

4. **Touch targets too small**
   - Use mobile-button classes
   - Ensure minimum 44px height/width
   - Add proper padding

### Performance Tips

1. **Optimize images**
   - Use responsive images
   - Compress images appropriately
   - Use WebP format when possible

2. **Minimize JavaScript**
   - Use CSS for animations when possible
   - Lazy load components
   - Debounce resize events

3. **Optimize CSS**
   - Use utility classes
   - Minimize custom CSS
   - Use CSS-in-JS sparingly

## Conclusion

This responsive design system provides a solid foundation for creating mobile-friendly applications. By following these guidelines and using the provided components, you can ensure your application works well across all devices and screen sizes.

Remember to:
- Test on real devices
- Follow mobile-first principles
- Ensure accessibility
- Optimize for performance
- Keep user experience in mind

For more information, refer to the individual component documentation and examples in the codebase. 