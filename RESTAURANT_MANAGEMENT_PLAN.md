# Restaurant Management UI Plan

## Overview

This document outlines the plan for implementing UI/UX flows that allow restaurant owners to:
1. **Create/Add New Restaurants**
2. **Add Menu Items to Existing Restaurants**

---

## 1. Add New Restaurant Flow

### 1.1 Entry Points

**Option A: From Dashboard (Recommended)**
- **Location**: Restaurant Dashboard (`/restaurant/dashboard`)
- **Trigger**: "Create Restaurant" button in header or empty state
- **When to show**: 
  - Always visible in header (if owner has < 3 restaurants)
  - Or shown in empty state when no restaurants exist

**Option B: From Navigation**
- **Location**: Sidebar or top navigation menu
- **Trigger**: "Add Restaurant" menu item

### 1.2 Page Structure: Create Restaurant (`/restaurant/create`)

#### Header Section
- Back button (to dashboard)
- Page title: "Create New Restaurant"
- Progress indicator (optional, for multi-step form)

#### Form Sections

**Section 1: Basic Information**
- Restaurant Name* (required)
- Description (textarea, optional)
- Cuisine Type* (dropdown/select, required)
  - Options: Italian, Chinese, Indian, Mexican, American, Japanese, Thai, etc.
- Restaurant Image URL (optional)
  - Input field for image URL
  - Preview of uploaded image
  - Future: File upload capability

**Section 2: Location & Contact**
- Address* (required)
- City* (required)
- State (optional)
- Zip Code (optional)
- Phone* (required, with validation)
- Email (optional, with email validation)
- Latitude/Longitude (optional, for future map integration)

**Section 3: Operating Hours**
- Opening Time (time picker, optional)
- Closing Time (time picker, optional)
- Future: Day-wise hours (Mon-Sun)

#### Form Actions
- **Cancel Button**: Navigate back to dashboard
- **Save as Draft** (optional): Save without activating
- **Create Restaurant Button**: Submit form

### 1.3 Form Validation

**Required Fields**:
- Restaurant Name
- Address
- City
- Phone

**Validation Rules**:
- Name: Min 3 characters, Max 100 characters
- Phone: Valid phone format
- Email: Valid email format (if provided)
- Opening/Closing Time: Closing time must be after opening time

### 1.4 Success Flow

After successful creation:
1. Show success toast: "Restaurant created successfully!"
2. Navigate to restaurant management page OR
3. Show option to "Add Menu Items" immediately
4. Update restaurant list in dashboard

### 1.5 Error Handling

- Display validation errors inline (below each field)
- Show API error messages in toast
- Handle network errors gracefully
- Prevent duplicate submissions

---

## 2. Add Menu Items Flow

### 2.1 Entry Points

**Option A: From Restaurant Dashboard (Recommended)**
- **Location**: Restaurant Dashboard (`/restaurant/dashboard`)
- **Trigger**: 
  - "Manage Menu" button next to restaurant selector
  - "Add Menu Item" button in menu management section
  - Direct link from restaurant card

**Option B: From Restaurant Menu Page**
- **Location**: Restaurant Menu Management Page (`/restaurant/:id/menu`)
- **Trigger**: "Add New Item" button

### 2.2 Page Structure: Menu Management (`/restaurant/:id/menu`)

#### Header Section
- Back button (to dashboard)
- Restaurant name
- "Add Menu Item" button (opens modal/form)

#### Menu Display
- **View Options**: 
  - List view (default)
  - Category view (grouped by category)
- **Filter Options**:
  - Filter by category
  - Filter by availability (Available/Unavailable)
  - Search by name

#### Menu Item Cards/List
Each item shows:
- Item image (or placeholder)
- Item name
- Category
- Price
- Availability status (toggle)
- Preparation time
- Actions: Edit, Delete/Deactivate

### 2.3 Add Menu Item Form (Modal or Page)

#### Modal Approach (Recommended for Quick Add)
- **Trigger**: "Add Menu Item" button
- **Modal Size**: Large modal (covers 70% of screen)
- **Form Fields**:
  - Item Name* (required)
  - Description (textarea, optional)
  - Category* (required, dropdown or create new)
    - Common categories: Appetizers, Main Course, Desserts, Beverages, etc.
    - Option to add new category
  - Price* (required, number input with currency symbol)
  - Image URL (optional)
    - Preview of image
  - Preparation Time (optional, in minutes)
  - Availability Toggle (default: Available)

#### Full Page Approach (For Detailed Forms)
- **Route**: `/restaurant/:id/menu/add`
- **Use Case**: When form is complex or needs more space
- Same fields as modal, but in full page layout

### 2.4 Form Validation

**Required Fields**:
- Item Name
- Category
- Price

**Validation Rules**:
- Name: Min 2 characters, Max 100 characters
- Price: Must be positive number, Max 2 decimal places
- Preparation Time: Must be positive integer (if provided)
- Category: Must be valid category name

### 2.5 Success Flow

After successful creation:
1. Show success toast: "Menu item added successfully!"
2. Close modal (if modal) or navigate back (if page)
3. Refresh menu list
4. Highlight newly added item (optional)

### 2.6 Bulk Operations (Future Enhancement)
- Import menu items from CSV
- Duplicate existing item
- Batch edit multiple items

---

## 3. UI/UX Design Considerations

### 3.1 Design Consistency
- Match existing dashboard design language
- Use same color scheme (orange/red theme)
- Consistent button styles and spacing
- Responsive design (mobile-friendly)

### 3.2 User Experience
- **Progressive Disclosure**: Show basic fields first, advanced fields optional
- **Inline Validation**: Show errors as user types
- **Auto-save Drafts**: Save form data locally (localStorage) to prevent data loss
- **Loading States**: Show loading indicators during API calls
- **Confirmation Dialogs**: For delete operations
- **Success Feedback**: Clear success messages and visual feedback

### 3.3 Accessibility
- Proper form labels
- Keyboard navigation support
- Screen reader friendly
- Focus management in modals

---

## 4. Component Structure

### 4.1 New Components Needed

#### Restaurant Creation
- `CreateRestaurant.jsx` - Main form page
- `RestaurantForm.jsx` - Reusable form component
- `RestaurantFormSection.jsx` - Form section wrapper
- `ImageUploadPreview.jsx` - Image preview component (future)

#### Menu Management
- `MenuManagement.jsx` - Main menu management page
- `MenuItemsList.jsx` - List of menu items
- `MenuItemCard.jsx` - Individual menu item card
- `AddMenuItemModal.jsx` - Modal for adding menu items
- `MenuItemForm.jsx` - Reusable menu item form
- `CategorySelector.jsx` - Category dropdown with create option
- `AvailabilityToggle.jsx` - Toggle switch for availability

### 4.2 Updated Components
- `RestaurantDashboard.jsx` - Add "Create Restaurant" and "Manage Menu" buttons
- Navigation components - Add menu management links

---

## 5. API Integration

### 5.1 Restaurant Creation API

**Endpoint**: `POST /api/restaurants`

**Request Body**:
```javascript
{
  name: string (required),
  description: string (optional),
  cuisine_type: string (optional),
  address: string (required),
  city: string (required),
  state: string (optional),
  zip_code: string (optional),
  phone: string (required),
  email: string (optional),
  latitude: number (optional),
  longitude: number (optional),
  opening_time: string (optional, format: "HH:MM"),
  closing_time: string (optional, format: "HH:MM"),
  image_url: string (optional)
}
```

**Response**:
```javascript
{
  success: true,
  message: "Restaurant created successfully",
  data: {
    restaurant: { ... }
  }
}
```

### 5.2 Menu Item Creation API

**Endpoint**: `POST /api/restaurants/:restaurantId/menu-items`

**Request Body**:
```javascript
{
  name: string (required),
  description: string (optional),
  price: number (required),
  category: string (required),
  image_url: string (optional),
  preparation_time: number (optional, in minutes)
}
```

**Response**:
```javascript
{
  success: true,
  message: "Menu item created successfully",
  data: {
    menuItem: { ... }
  }
}
```

### 5.3 Additional APIs Needed

**Get Restaurant Menu** (for menu management page):
- `GET /api/restaurants/:restaurantId/menu` (already exists)

**Update Menu Item**:
- `PUT /api/menu-items/:id` (already exists)

**Delete/Deactivate Menu Item**:
- `DELETE /api/menu-items/:id` (already exists)

---

## 6. Navigation Flow

### 6.1 Restaurant Creation Flow
```
Restaurant Dashboard
    ↓ (Click "Create Restaurant")
Create Restaurant Page
    ↓ (Fill form & Submit)
Success → Redirect to Dashboard
    OR
    → Option to "Add Menu Items" → Menu Management
```

### 6.2 Menu Item Addition Flow
```
Restaurant Dashboard
    ↓ (Click "Manage Menu" or "Add Menu Item")
Menu Management Page
    ↓ (Click "Add Menu Item")
Add Menu Item Modal/Page
    ↓ (Fill form & Submit)
Success → Close Modal/Redirect → Refresh Menu List
```

### 6.3 Alternative Flow (Quick Add)
```
Restaurant Dashboard
    ↓ (Click "Add Menu Item" button)
Add Menu Item Modal (Inline)
    ↓ (Fill form & Submit)
Success → Modal closes → Menu list updates
```

---

## 7. Routes to Add

### 7.1 Restaurant Creation
```javascript
<Route 
  path="/restaurant/create" 
  element={
    <ProtectedRoute allowedRoles={['restaurant_owner']}>
      <CreateRestaurant />
    </ProtectedRoute>
  } 
/>
```

### 7.2 Menu Management
```javascript
<Route 
  path="/restaurant/:id/menu" 
  element={
    <ProtectedRoute allowedRoles={['restaurant_owner']}>
      <MenuManagement />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/restaurant/:id/menu/add" 
  element={
    <ProtectedRoute allowedRoles={['restaurant_owner']}>
      <AddMenuItem />
    </ProtectedRoute>
  } 
/>
```

---

## 8. Implementation Priority

### Phase 1: Core Functionality (MVP)
1. ✅ Create Restaurant form (full page)
2. ✅ Add Menu Item modal/form
3. ✅ Basic menu list display
4. ✅ Integration with existing dashboard

### Phase 2: Enhanced Features
1. Menu item editing
2. Menu item deletion/deactivation
3. Category management
4. Image upload (if not using URLs)
5. Bulk operations

### Phase 3: Advanced Features
1. Menu item duplication
2. CSV import/export
3. Advanced filtering and search
4. Menu analytics
5. Menu templates

---

## 9. Form Field Details

### 9.1 Restaurant Creation Form

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Name | Text | Yes | 3-100 chars | Restaurant name |
| Description | Textarea | No | Max 500 chars | About the restaurant |
| Cuisine Type | Select | No | - | Dropdown with common types |
| Address | Text | Yes | Min 5 chars | Street address |
| City | Text | Yes | Min 2 chars | City name |
| State | Text | No | - | State/Province |
| Zip Code | Text | No | - | Postal code |
| Phone | Tel | Yes | Valid format | Contact number |
| Email | Email | No | Valid email | Contact email |
| Opening Time | Time | No | HH:MM format | Opening hour |
| Closing Time | Time | No | HH:MM format | Closing hour |
| Image URL | URL | No | Valid URL | Restaurant image |

### 9.2 Menu Item Form

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Name | Text | Yes | 2-100 chars | Item name |
| Description | Textarea | No | Max 300 chars | Item description |
| Category | Select/Create | Yes | Valid category | Dropdown + create option |
| Price | Number | Yes | > 0, 2 decimals | Item price |
| Image URL | URL | No | Valid URL | Item image |
| Preparation Time | Number | No | > 0 | Minutes |
| Available | Toggle | No | Boolean | Default: true |

---

## 10. Error Scenarios & Handling

### 10.1 Restaurant Creation Errors
- **Validation Errors**: Show inline errors for each field
- **Duplicate Restaurant**: "You already have a restaurant with this name"
- **Network Error**: "Failed to create restaurant. Please try again."
- **Server Error**: Show generic error with retry option

### 10.2 Menu Item Errors
- **Validation Errors**: Show inline errors
- **Restaurant Not Found**: "Restaurant not found"
- **Unauthorized**: "You can only add items to your own restaurants"
- **Network Error**: "Failed to add menu item. Please try again."

---

## 11. Success States & Feedback

### 11.1 Restaurant Creation Success
- Success toast notification
- Redirect to dashboard with new restaurant selected
- Show success message: "Restaurant created! Start by adding menu items."
- Optional: Show onboarding tooltip for next steps

### 11.2 Menu Item Success
- Success toast notification
- Close modal (if modal) or redirect (if page)
- Refresh menu list
- Highlight new item (optional animation)
- Show item count update

---

## 12. Future Enhancements

### 12.1 Restaurant Management
- Edit restaurant details
- Restaurant settings (accepting orders, active status)
- Restaurant analytics
- Multiple location support

### 12.2 Menu Management
- Drag-and-drop menu item ordering
- Menu item variants (size, toppings, etc.)
- Nutritional information
- Allergen information
- Menu item images upload (not just URLs)
- Menu templates
- Seasonal menus
- Menu item recommendations

---

## 13. Testing Checklist

### 13.1 Restaurant Creation
- [ ] Form validation works correctly
- [ ] Required fields are enforced
- [ ] Success flow works
- [ ] Error handling works
- [ ] Navigation works correctly
- [ ] Mobile responsive
- [ ] Image preview works (if implemented)

### 13.2 Menu Item Addition
- [ ] Form validation works
- [ ] Category selection works
- [ ] Modal opens/closes correctly
- [ ] Success flow works
- [ ] Menu list updates after addition
- [ ] Error handling works
- [ ] Mobile responsive

---

## 14. Design Mockups Considerations

### 14.1 Create Restaurant Page
- Clean, professional form layout
- Sectioned form with clear headings
- Helpful placeholder text
- Inline validation feedback
- Loading states during submission

### 14.2 Menu Management Page
- Card-based or list-based layout
- Easy-to-scan menu items
- Quick actions (edit, delete) visible
- Search and filter prominently placed
- "Add Item" button always visible

### 14.3 Add Menu Item Modal
- Centered modal with backdrop
- Clear form structure
- Image preview area
- Category dropdown with search
- Save/Cancel actions clearly visible

---

## Conclusion

This plan provides a comprehensive roadmap for implementing restaurant and menu item management features. The implementation should follow a phased approach, starting with core functionality and gradually adding enhanced features.

**Key Principles**:
- User-friendly forms with clear validation
- Seamless navigation between related features
- Consistent design language
- Mobile-responsive design
- Proper error handling and user feedback

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: DineFlow Development Team
