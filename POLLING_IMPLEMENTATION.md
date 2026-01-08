# Auto-Refresh (Polling) Implementation

## Overview

This document describes the auto-refresh (polling) functionality implemented to provide real-time order status updates to customers without requiring manual page refreshes.

## Problem Statement

When restaurant owners update order statuses (e.g., from "preparing" to "ready"), customers had to manually refresh their browser to see the updated status. This created a poor user experience and could lead to confusion about order progress.

## Solution

Implemented automatic polling (periodic data fetching) on order-related pages to automatically fetch and display the latest order status updates.

---

## Implementation Details

### 1. Order Detail Page (`/pages/OrderDetail.jsx`)

**Purpose**: Display detailed information about a specific order with real-time status updates.

**Polling Configuration**:
- **Interval**: 5 seconds
- **Condition**: Only polls for active orders (not `delivered` or `cancelled`)
- **Manual Refresh**: Available via refresh button in header

**Features**:
- Automatic status updates every 5 seconds
- Toast notification when order status changes
- Manual refresh button with loading indicator
- Polling automatically stops when order is completed/cancelled

**Code Structure**:
```javascript
// Initial fetch on component mount
useEffect(() => {
  fetchOrderDetails();
}, [id]);

// Auto-refresh polling for active orders
useEffect(() => {
  if (!order || ['delivered', 'cancelled'].includes(order.status)) {
    // Stop polling for completed orders
    return;
  }
  
  intervalRef.current = setInterval(() => {
    fetchOrderDetails(false); // Silent refresh
  }, 5000);
  
  return () => clearInterval(intervalRef.current);
}, [order?.status, order?.id]);
```

---

### 2. Orders List Page (`/pages/Orders.jsx`)

**Purpose**: Display list of all customer orders with filtering capabilities.

**Polling Configuration**:
- **Interval**: 10 seconds
- **Condition**: Always polls (regardless of order status)
- **Manual Refresh**: Available via refresh button in header

**Features**:
- Automatic list refresh every 10 seconds
- Manual refresh button with loading indicator
- Maintains current filter selection during refresh

**Code Structure**:
```javascript
useEffect(() => {
  fetchOrders(true); // Initial load
  
  // Auto-refresh every 10 seconds
  intervalRef.current = setInterval(() => {
    fetchOrders(false); // Silent refresh
  }, 10000);
  
  return () => clearInterval(intervalRef.current);
}, [statusFilter]);
```

---

### 3. Home Page - Recent Orders (`/pages/Home.jsx`)

**Purpose**: Display recent orders section on the customer home page.

**Polling Configuration**:
- **Interval**: 15 seconds
- **Condition**: Always polls
- **Manual Refresh**: Not available (automatic only)

**Features**:
- Silent background updates
- No loading indicators (non-intrusive)
- Updates recent orders section automatically

**Code Structure**:
```javascript
useEffect(() => {
  fetchRecentOrders();
  
  // Auto-refresh every 15 seconds
  const interval = setInterval(() => {
    fetchRecentOrders();
  }, 15000);
  
  return () => clearInterval(interval);
}, []);
```

---

## Technical Implementation

### Key Technologies Used

1. **React Hooks**:
   - `useState`: Manage loading and refreshing states
   - `useEffect`: Set up and clean up polling intervals
   - `useRef`: Store interval reference for cleanup

2. **Interval Management**:
   - Uses `setInterval` for periodic API calls
   - Proper cleanup with `clearInterval` in `useEffect` return function
   - Prevents memory leaks and multiple intervals

### Polling Strategy

**Different Intervals for Different Pages**:
- **Order Detail (5s)**: Most frequent - user is actively viewing order
- **Orders List (10s)**: Moderate - user may be browsing
- **Home Page (15s)**: Least frequent - background update

**Smart Polling**:
- Order Detail page stops polling when order is `delivered` or `cancelled`
- Reduces unnecessary API calls for completed orders
- Improves performance and reduces server load

### State Management

**Loading States**:
- `isLoading`: Initial page load (shows full loading spinner)
- `isRefreshing`: Background refresh (shows subtle indicator)

**User Experience**:
- Initial load: Full loading screen
- Auto-refresh: Silent update (no full page reload)
- Manual refresh: Shows loading indicator on button

---

## API Calls

### Endpoints Used

1. **Order Detail**:
   - `GET /api/orders/:id`
   - Called every 5 seconds for active orders

2. **Orders List**:
   - `GET /api/orders?status={filter}`
   - Called every 10 seconds

3. **Recent Orders**:
   - `GET /api/orders?limit=5`
   - Called every 15 seconds

### Error Handling

- **Silent Failures**: Auto-refresh failures don't show error toasts (non-intrusive)
- **Manual Refresh**: Shows error toast if manual refresh fails
- **Network Issues**: Polling continues, errors logged to console

---

## User Experience Features

### 1. Status Change Notifications

When order status changes during auto-refresh:
- Toast notification appears: "Order status updated to [Status]"
- Visual feedback without page reload
- Non-intrusive notification (2 second duration)

### 2. Visual Indicators

- **Refresh Button**: Shows spinning icon when refreshing
- **Status Badges**: Update automatically with new status
- **No Full Page Reload**: Smooth updates without flickering

### 3. Manual Control

Users can manually refresh at any time:
- Refresh button in header
- Immediate update on click
- Visual feedback during refresh

---

## Performance Considerations

### Optimization Strategies

1. **Conditional Polling**:
   - Stops polling for completed orders
   - Reduces unnecessary API calls

2. **Silent Refreshes**:
   - Background updates don't show full loading states
   - Maintains smooth user experience

3. **Proper Cleanup**:
   - Intervals cleared on component unmount
   - Prevents memory leaks
   - Prevents multiple intervals running simultaneously

### Server Load

- **Polling Frequency**: Balanced between real-time updates and server load
- **API Efficiency**: Uses existing endpoints, no additional endpoints needed
- **Scalability**: Can be adjusted based on server capacity

---

## Configuration

### Polling Intervals

Current intervals can be adjusted in the respective component files:

| Page | Current Interval | File Location |
|------|----------------|---------------|
| Order Detail | 5 seconds | `src/pages/OrderDetail.jsx` |
| Orders List | 10 seconds | `src/pages/Orders.jsx` |
| Home Page | 15 seconds | `src/pages/Home.jsx` |

### Adjusting Intervals

To change polling intervals, modify the `setInterval` duration:

```javascript
// Example: Change Order Detail to 10 seconds
intervalRef.current = setInterval(() => {
  fetchOrderDetails(false);
}, 10000); // Changed from 5000 to 10000
```

---

## Future Improvements

### Potential Enhancements

1. **WebSocket Integration**:
   - Replace polling with WebSocket for true real-time updates
   - Eliminates periodic API calls
   - Instant status updates

2. **Adaptive Polling**:
   - Increase frequency when order status is changing
   - Decrease frequency for stable orders
   - Dynamic interval based on order activity

3. **Background Sync**:
   - Service Worker for background updates
   - Updates even when tab is inactive
   - Push notifications for status changes

4. **Optimistic Updates**:
   - Update UI immediately when restaurant updates status
   - Sync with server in background
   - Better perceived performance

5. **Configurable Intervals**:
   - User preference for update frequency
   - Settings page to adjust polling intervals
   - Battery-saving mode (longer intervals)

---

## Testing

### Manual Testing Checklist

- [ ] Order Detail page auto-refreshes every 5 seconds
- [ ] Polling stops when order is delivered
- [ ] Polling stops when order is cancelled
- [ ] Toast notification appears on status change
- [ ] Manual refresh button works correctly
- [ ] Orders List page auto-refreshes every 10 seconds
- [ ] Home page recent orders auto-refresh every 15 seconds
- [ ] No memory leaks (check browser DevTools)
- [ ] Multiple intervals don't stack up
- [ ] Proper cleanup on component unmount

### Browser DevTools Testing

1. **Network Tab**: Verify API calls are made at correct intervals
2. **Console**: Check for errors during polling
3. **Performance Tab**: Monitor for memory leaks
4. **React DevTools**: Verify component state updates correctly

---

## Troubleshooting

### Common Issues

**Issue**: Polling not working
- **Check**: Browser console for errors
- **Verify**: API endpoints are accessible
- **Check**: Component is mounted and not unmounted

**Issue**: Multiple intervals running
- **Check**: Cleanup function in `useEffect`
- **Verify**: `intervalRef.current` is properly cleared
- **Check**: Component not re-rendering unnecessarily

**Issue**: High server load
- **Solution**: Increase polling intervals
- **Solution**: Implement WebSocket instead
- **Solution**: Add rate limiting on backend

**Issue**: Status not updating
- **Check**: API response structure
- **Verify**: State update logic
- **Check**: Status comparison logic

---

## Code Examples

### Basic Polling Pattern

```javascript
import { useState, useEffect, useRef } from 'react';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchData(false); // Silent refresh
    }, 5000); // 5 seconds

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchData = async (showLoading = true) => {
    // Fetch logic here
  };
};
```

### Conditional Polling

```javascript
useEffect(() => {
  // Only poll if condition is met
  if (!shouldPoll) {
    return;
  }

  intervalRef.current = setInterval(() => {
    fetchData();
  }, 5000);

  return () => clearInterval(intervalRef.current);
}, [shouldPoll]);
```

---

## Conclusion

The polling implementation provides a seamless user experience by automatically updating order statuses without requiring manual page refreshes. The solution is lightweight, performant, and can be easily enhanced with WebSocket integration in the future.

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: DineFlow Development Team
