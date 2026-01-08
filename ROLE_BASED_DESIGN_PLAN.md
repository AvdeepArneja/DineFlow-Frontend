# Frontend Role-Based Design Plan

This document outlines the complete design structure for DineFlow frontend based on user roles.

---

## 🎯 User Roles

1. **Customer** (`customer`) - Order food from restaurants
2. **Restaurant Owner** (`restaurant_owner`) - Manage restaurant, menu, and orders
3. **Rider** (`rider`) - Accept and deliver orders

---

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── common/              # Shared components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── RoleSelector.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Modal.jsx
│   │
│   ├── layout/              # Layout components
│   │   ├── Navbar.jsx       # Main navigation
│   │   ├── Sidebar.jsx      # Sidebar for restaurant/rider dashboards
│   │   ├── Footer.jsx       # Footer (optional)
│   │   └── Layout.jsx       # Main layout wrapper
│   │
│   ├── customer/            # Customer-specific components
│   │   ├── RestaurantCard.jsx
│   │   ├── MenuItemCard.jsx
│   │   ├── CartItem.jsx
│   │   ├── AddressCard.jsx
│   │   ├── OrderCard.jsx
│   │   └── OrderTracking.jsx
│   │
│   ├── restaurant/          # Restaurant-specific components
│   │   ├── OrderCard.jsx
│   │   ├── MenuItemForm.jsx
│   │   ├── RestaurantForm.jsx
│   │   └── StatsCard.jsx
│   │
│   └── rider/               # Rider-specific components
│       ├── AvailableOrderCard.jsx
│       ├── ActiveDeliveryCard.jsx
│       └── DeliveryHistoryCard.jsx
│
├── pages/
│   ├── auth/                # Authentication pages
│   │   ├── Login.jsx       ✅
│   │   └── Signup.jsx       ✅
│   │
│   ├── customer/            # Customer pages
│   │   ├── Home.jsx         # Restaurant listing & search
│   │   ├── RestaurantDetail.jsx  # Restaurant menu view
│   │   ├── Cart.jsx         # Shopping cart
│   │   ├── Checkout.jsx     # Order placement
│   │   ├── Orders.jsx       # Order history
│   │   ├── OrderDetail.jsx # Order details & tracking
│   │   ├── Addresses.jsx   # Manage delivery addresses
│   │   └── Profile.jsx      # User profile
│   │
│   ├── restaurant/          # Restaurant owner pages
│   │   ├── Dashboard.jsx    # Overview & stats
│   │   ├── Orders.jsx       # Manage orders
│   │   ├── Menu.jsx         # Menu management
│   │   ├── MenuItemForm.jsx # Add/Edit menu item
│   │   ├── RestaurantSettings.jsx  # Restaurant info
│   │   └── Analytics.jsx    # Reports & analytics
│   │
│   └── rider/              # Rider pages
│       ├── Dashboard.jsx    # Available orders
│       ├── ActiveDeliveries.jsx  # Current deliveries
│       ├── DeliveryHistory.jsx   # Past deliveries
│       └── Profile.jsx      # Rider profile
│
├── routes/
│   ├── AppRoutes.jsx        # Main routing configuration
│   ├── ProtectedRoute.jsx   ✅
│   └── CustomerRoutes.jsx   # Customer route group
│   └── RestaurantRoutes.jsx # Restaurant route group
│   └── RiderRoutes.jsx      # Rider route group
│
├── context/
│   ├── AuthContext.jsx      ✅
│   └── CartContext.jsx     # Cart state management
│
├── api/
│   ├── auth.js             ✅
│   ├── restaurants.js      # Restaurant API calls
│   ├── menu.js             # Menu API calls
│   ├── cart.js             # Cart API calls
│   ├── orders.js           # Order API calls
│   ├── addresses.js         # Address API calls
│   └── axios.js            ✅
│
└── utils/
    ├── constants.js        # App constants
    ├── helpers.js          # Helper functions
    └── formatters.js       # Data formatters
```

---

## 🛣️ Route Structure

### Public Routes
```
/login          → Login page
/signup         → Signup page
```

### Customer Routes (`/customer/*`)
```
/customer/home              → Restaurant listing & search
/customer/restaurant/:id    → Restaurant detail & menu
/customer/cart              → Shopping cart
/customer/checkout          → Order placement
/customer/orders            → Order history
/customer/orders/:id        → Order details & tracking
/customer/addresses         → Manage addresses
/customer/profile           → User profile
```

### Restaurant Owner Routes (`/restaurant/*`)
```
/restaurant/dashboard       → Overview & stats
/restaurant/orders          → Manage orders
/restaurant/orders/:id      → Order details
/restaurant/menu            → Menu management
/restaurant/menu/new        → Add menu item
/restaurant/menu/:id/edit   → Edit menu item
/restaurant/settings        → Restaurant settings
/restaurant/analytics       → Reports & analytics
```

### Rider Routes (`/rider/*`)
```
/rider/dashboard            → Available orders
/rider/deliveries/active    → Active deliveries
/rider/deliveries/history   → Delivery history
/rider/profile              → Rider profile
```

---

## 🎨 Layout Components

### 1. **Main Layout** (`components/layout/Layout.jsx`)
- Wraps all authenticated pages
- Contains Navbar and conditional Sidebar
- Role-based navigation

### 2. **Navbar** (`components/layout/Navbar.jsx`)
- **Customer Navbar:**
  - Logo (links to home)
  - Search bar
  - Cart icon (with item count)
  - User menu (Profile, Orders, Addresses, Logout)

- **Restaurant Navbar:**
  - Logo
  - Restaurant name
  - Navigation links (Dashboard, Orders, Menu, Settings)
  - User menu (Profile, Logout)

- **Rider Navbar:**
  - Logo
  - Navigation links (Dashboard, Active Deliveries, History)
  - User menu (Profile, Logout)

### 3. **Sidebar** (`components/layout/Sidebar.jsx`)
- Only for Restaurant Owner and Rider dashboards
- Collapsible on mobile
- Active route highlighting

---

## 📱 Page Designs

### **Customer Pages**

#### 1. **Home** (`/customer/home`)
**Purpose:** Browse and search restaurants

**Features:**
- Search bar (by restaurant name, cuisine)
- Filter by:
  - City (dropdown)
  - Cuisine type
  - Rating
  - Price range
- Restaurant cards grid:
  - Restaurant image
  - Name
  - Cuisine type
  - Rating & review count
  - Delivery time
  - Delivery fee
  - "View Menu" button
- Pagination or infinite scroll

**API Calls:**
- `GET /api/restaurants` (with filters)
- `GET /api/restaurants/cities`

---

#### 2. **Restaurant Detail** (`/customer/restaurant/:id`)
**Purpose:** View restaurant menu and add items to cart

**Features:**
- Restaurant header:
  - Image
  - Name, cuisine, rating
  - Delivery time, fee
  - Address
- Menu grouped by category:
  - Category tabs/sections
  - Menu items:
    - Image
    - Name, description
    - Price
    - Add to cart button
    - Availability indicator
- Sticky cart summary (bottom or side)
- "View Cart" button

**API Calls:**
- `GET /api/restaurants/:id`
- `GET /api/restaurants/:id/menu`

---

#### 3. **Cart** (`/customer/cart`)
**Purpose:** Review and modify cart items

**Features:**
- Cart items list:
  - Item image
  - Name, description
  - Quantity controls (+/-)
  - Price
  - Remove button
- Order summary:
  - Subtotal
  - Delivery fee
  - Tax (if applicable)
  - Total
- Delivery address selector
- "Proceed to Checkout" button
- Empty cart state

**API Calls:**
- `GET /api/cart`
- `PUT /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `GET /api/addresses`

---

#### 4. **Checkout** (`/customer/checkout`)
**Purpose:** Place order

**Features:**
- Order summary (read-only)
- Delivery address:
  - Select from saved addresses
  - Add new address button
- Payment method (UI only, non-functional)
- Order total breakdown
- "Place Order" button
- Loading state during order creation

**API Calls:**
- `POST /api/orders` (create order)

---

#### 5. **Orders** (`/customer/orders`)
**Purpose:** View order history

**Features:**
- Order cards:
  - Order number
  - Restaurant name
  - Order date
  - Status badge
  - Total amount
  - "View Details" button
- Filter by status
- Empty state

**API Calls:**
- `GET /api/orders`

---

#### 6. **Order Detail** (`/customer/orders/:id`)
**Purpose:** View order details and track status

**Features:**
- Order header:
  - Order number
  - Status timeline
  - Estimated delivery time
- Order items list
- Delivery address
- Order summary (totals)
- Cancel button (if status allows)
- Real-time status updates (polling or WebSocket)

**API Calls:**
- `GET /api/orders/:id`
- `GET /api/orders/:id/track`
- `PUT /api/orders/:id/cancel`

---

#### 7. **Addresses** (`/customer/addresses`)
**Purpose:** Manage delivery addresses

**Features:**
- Address cards:
  - Label (Home, Work, etc.)
  - Full address
  - Default badge
  - Edit/Delete buttons
- "Add New Address" button
- Add/Edit address form (modal or page)

**API Calls:**
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/:id`
- `PUT /api/addresses/:id/set-default`
- `DELETE /api/addresses/:id`

---

#### 8. **Profile** (`/customer/profile`)
**Purpose:** Manage user profile

**Features:**
- Profile form:
  - Name
  - Email
  - Phone
  - Change password section
- Save button

**API Calls:**
- `GET /api/auth/me`
- `PUT /api/users/profile` (future)

---

### **Restaurant Owner Pages**

#### 1. **Dashboard** (`/restaurant/dashboard`)
**Purpose:** Overview and statistics

**Features:**
- Stats cards:
  - Today's orders
  - Pending orders
  - Total revenue (today/week/month)
  - Average rating
- Recent orders list
- Quick actions:
  - Add menu item
  - View all orders
- Charts (optional):
  - Orders over time
  - Popular items

**API Calls:**
- `GET /api/restaurants/my-restaurants`
- `GET /api/orders/restaurant/my-orders` (with filters)

---

#### 2. **Orders** (`/restaurant/orders`)
**Purpose:** Manage incoming orders

**Features:**
- Order cards:
  - Order number
  - Customer name
  - Order items
  - Delivery address
  - Order time
  - Status badge
  - Actions (Accept, Prepare, Ready, etc.)
- Filter by status
- Real-time updates

**API Calls:**
- `GET /api/orders/restaurant/my-orders`
- `PUT /api/orders/:id/status`

---

#### 3. **Order Detail** (`/restaurant/orders/:id`)
**Purpose:** View and update order details

**Features:**
- Order information
- Customer details
- Delivery address
- Order items
- Status update buttons
- Timeline

**API Calls:**
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`

---

#### 4. **Menu** (`/restaurant/menu`)
**Purpose:** Manage menu items

**Features:**
- Menu items grouped by category
- Item cards:
  - Image
  - Name, description
  - Price
  - Availability toggle
  - Edit/Delete buttons
- "Add Menu Item" button
- Category filter

**API Calls:**
- `GET /api/restaurants/:id/menu`
- `POST /api/restaurants/:id/menu-items`
- `PUT /api/menu-items/:id`
- `PUT /api/menu-items/:id/toggle-availability`
- `DELETE /api/menu-items/:id`

---

#### 5. **Menu Item Form** (`/restaurant/menu/new`, `/restaurant/menu/:id/edit`)
**Purpose:** Add or edit menu item

**Features:**
- Form fields:
  - Name
  - Description
  - Category
  - Price
  - Image upload
  - Preparation time
  - Availability toggle
- Save/Cancel buttons

**API Calls:**
- `POST /api/restaurants/:id/menu-items` (new)
- `PUT /api/menu-items/:id` (edit)
- `GET /api/menu-items/:id` (edit - load data)

---

#### 6. **Restaurant Settings** (`/restaurant/settings`)
**Purpose:** Manage restaurant information

**Features:**
- Restaurant form:
  - Name
  - Description
  - Cuisine type
  - Address
  - Phone
  - Opening hours
  - Image upload
- Save button

**API Calls:**
- `GET /api/restaurants/my-restaurants`
- `PUT /api/restaurants/:id`

---

#### 7. **Analytics** (`/restaurant/analytics`)
**Purpose:** View reports and analytics

**Features:**
- Revenue charts
- Popular items
- Order trends
- Customer insights
- Export options

**API Calls:**
- Custom analytics endpoints (future)

---

### **Rider Pages**

#### 1. **Dashboard** (`/rider/dashboard`)
**Purpose:** View available orders

**Features:**
- Available orders list:
  - Restaurant name
  - Delivery address
  - Distance
  - Order value
  - Estimated delivery fee
  - "Accept Order" button
- Map view (optional)
- Filter by distance/area

**API Calls:**
- `GET /api/orders/rider/available`

---

#### 2. **Active Deliveries** (`/rider/deliveries/active`)
**Purpose:** Manage current deliveries

**Features:**
- Active delivery cards:
  - Order number
  - Restaurant address
  - Customer address
  - Order items
  - Status
  - "Mark as Picked Up" button
  - "Mark as Delivered" button
- Map integration (optional)
- Navigation to addresses

**API Calls:**
- `GET /api/orders/rider/my-orders` (filter: active)
- `PUT /api/orders/:id/status`
- `PUT /api/orders/:id/assign-rider`

---

#### 3. **Delivery History** (`/rider/deliveries/history`)
**Purpose:** View past deliveries

**Features:**
- Past delivery cards:
  - Order number
  - Date
  - Restaurant & customer
  - Delivery fee earned
  - Status
- Filter by date
- Earnings summary

**API Calls:**
- `GET /api/orders/rider/my-orders` (filter: completed)

---

#### 4. **Profile** (`/rider/profile`)
**Purpose:** Manage rider profile

**Features:**
- Profile form
- Vehicle information
- Availability toggle
- Earnings summary

**API Calls:**
- `GET /api/auth/me`
- `PUT /api/users/profile` (future)

---

## 🔐 Protected Routes Implementation

### Route Protection Strategy

1. **Public Routes:** No authentication required
   - `/login`, `/signup`

2. **Protected Routes:** Authentication required
   - All `/customer/*`, `/restaurant/*`, `/rider/*` routes

3. **Role-Based Routes:** Specific roles only
   - Customer routes: `allowedRoles={['customer']}`
   - Restaurant routes: `allowedRoles={['restaurant_owner']}`
   - Rider routes: `allowedRoles={['rider']}`

### Implementation

```jsx
// AppRoutes.jsx structure
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* Customer Routes */}
  <Route path="/customer/*" element={
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerLayout>
        <CustomerRoutes />
      </CustomerLayout>
    </ProtectedRoute>
  } />

  {/* Restaurant Routes */}
  <Route path="/restaurant/*" element={
    <ProtectedRoute allowedRoles={['restaurant_owner']}>
      <RestaurantLayout>
        <RestaurantRoutes />
      </RestaurantLayout>
    </ProtectedRoute>
  } />

  {/* Rider Routes */}
  <Route path="/rider/*" element={
    <ProtectedRoute allowedRoles={['rider']}>
      <RiderLayout>
        <RiderRoutes />
      </RiderLayout>
    </ProtectedRoute>
  } />
</Routes>
```

---

## 🎨 Design Guidelines

### Color Scheme
- **Primary:** Orange/Red gradient (brand colors)
- **Success:** Green
- **Error:** Red
- **Warning:** Yellow
- **Info:** Blue

### Typography
- **Headings:** Bold, clear hierarchy
- **Body:** Readable, appropriate line height
- **Buttons:** Clear, action-oriented text

### Components
- **Cards:** Rounded corners, subtle shadows
- **Buttons:** Primary (orange), Secondary (gray), Danger (red)
- **Forms:** Clear labels, validation feedback
- **Loading:** Spinners, skeletons
- **Empty States:** Helpful messages, call-to-action

### Responsive Design
- **Mobile First:** Design for mobile, enhance for desktop
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## 📋 Implementation Priority

### Phase 1: Core Customer Flow (High Priority)
1. ✅ Authentication (Login/Signup)
2. Customer Home (Restaurant listing)
3. Restaurant Detail (Menu view)
4. Cart
5. Checkout
6. Orders (History & Details)

### Phase 2: Restaurant Management (High Priority)
1. Restaurant Dashboard
2. Orders Management
3. Menu Management
4. Restaurant Settings

### Phase 3: Rider Features (Medium Priority)
1. Rider Dashboard
2. Active Deliveries
3. Delivery History

### Phase 4: Enhanced Features (Low Priority)
1. Address Management
2. Profile Management
3. Analytics
4. Search & Filters
5. Notifications

---

## 🚀 Next Steps

1. **Update App.jsx** to use role-based routing
2. **Create Layout components** (Navbar, Sidebar, Layout)
3. **Create Customer pages** (start with Home)
4. **Create Restaurant pages** (start with Dashboard)
5. **Create Rider pages** (start with Dashboard)
6. **Implement API integration** for each page
7. **Add loading states and error handling**
8. **Implement real-time updates** (polling or WebSocket)

---

## 📝 Notes

- All pages should have loading states
- Error handling with user-friendly messages
- Form validation on frontend
- Responsive design for all screen sizes
- Accessibility considerations
- Performance optimization (lazy loading, code splitting)
