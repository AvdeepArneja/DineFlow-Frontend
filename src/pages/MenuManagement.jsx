import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  UtensilsCrossed,
  Image as ImageIcon,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { menuApi } from '../api/menu';
import { restaurantsApi } from '../api/restaurants';
import toast from 'react-hot-toast';

const MenuManagement = () => {
  const { id: restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuByCategory, setMenuByCategory] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    type: 'warning', // 'warning', 'danger', 'info'
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    preparation_time: '',
    is_available: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRestaurant();
    fetchMenuItems();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantsApi.getRestaurantById(restaurantId);
      if (response.success) {
        setRestaurant(response.data.restaurant);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant details');
    }
  };

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      // For restaurant owners, fetch all items (both available and unavailable)
      // We'll make two calls: one for available, one for unavailable, then merge them
      const [availableResponse, unavailableResponse] = await Promise.all([
        menuApi.getMenuItems(restaurantId, { is_available: 'true' }),
        menuApi.getMenuItems(restaurantId, { is_available: 'false' }),
      ]);

      if (availableResponse.success && unavailableResponse.success) {
        // Merge available and unavailable items
        const availableMenu = availableResponse.data.menu || {};
        const unavailableMenu = unavailableResponse.data.menu || {};
        
        // Merge categories
        const allCategories = new Set([
          ...(availableResponse.data.categories || []),
          ...(unavailableResponse.data.categories || []),
        ]);

        // Merge menu items by category
        const mergedMenu = { ...availableMenu };
        Object.keys(unavailableMenu).forEach((category) => {
          if (mergedMenu[category]) {
            mergedMenu[category] = [...mergedMenu[category], ...unavailableMenu[category]];
          } else {
            mergedMenu[category] = unavailableMenu[category];
          }
        });

        const items = Object.values(mergedMenu).flat();
        setMenuItems(items);
        setMenuByCategory(mergedMenu);
        setCategories(Array.from(allCategories).sort());
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Item name must be at least 2 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.image_url) {
      try {
        const url = new URL(formData.image_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.image_url = 'URL must start with http:// or https://';
        }
      } catch (e) {
        newErrors.image_url = 'Please enter a valid URL';
      }
    }

    if (formData.preparation_time && parseInt(formData.preparation_time) < 0) {
      newErrors.preparation_time = 'Preparation time must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        image_url: formData.image_url.trim() || null,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
      };

      if (editingItem) {
        // Update existing item
        const response = await menuApi.updateMenuItem(editingItem.id, menuItemData);
        if (response.success) {
          toast.success('Menu item updated successfully!');
          setShowAddModal(false);
          setEditingItem(null);
          resetForm();
          fetchMenuItems();
        }
      } else {
        // Create new item
        const response = await menuApi.createMenuItem(restaurantId, menuItemData);
        if (response.success) {
          toast.success('Menu item created successfully!');
          setShowAddModal(false);
          resetForm();
          fetchMenuItems();
        }
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      const message = error.response?.data?.message || 'Failed to save menu item. Please try again.';
      toast.error(message);

      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          const fieldMatch = err.match(/(\w+) is required/i) || err.match(/(\w+) must/i);
          if (fieldMatch) {
            const field = fieldMatch[1].toLowerCase();
            backendErrors[field] = err;
          }
        });
        if (Object.keys(backendErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...backendErrors }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      image_url: item.image_url || '',
      preparation_time: item.preparation_time?.toString() || '',
      is_available: item.is_available !== false,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    setConfirmModal({
      show: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${item?.name || 'this item'}"? This action cannot be undone and the item will be removed from customer view.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        await performDelete(itemId);
      },
    });
  };

  const performDelete = async (itemId) => {
    try {
      const response = await menuApi.deleteMenuItem(itemId);
      if (response.success) {
        toast.success('Menu item deleted successfully!');
        // Immediately remove from local state for instant feedback
        const updatedMenuByCategory = { ...menuByCategory };
        Object.keys(updatedMenuByCategory).forEach((category) => {
          updatedMenuByCategory[category] = updatedMenuByCategory[category].filter(
            (item) => item.id !== itemId
          );
          // Remove empty categories
          if (updatedMenuByCategory[category].length === 0) {
            delete updatedMenuByCategory[category];
          }
        });
        setMenuByCategory(updatedMenuByCategory);
        // Also refresh from server to ensure consistency
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      const message = error.response?.data?.message || 'Failed to delete menu item. Please try again.';
      toast.error(message);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus, itemName) => {
    const isMakingUnavailable = currentStatus;
    setConfirmModal({
      show: true,
      title: isMakingUnavailable ? 'Make Item Unavailable' : 'Make Item Available',
      message: isMakingUnavailable
        ? `Are you sure you want to make "${itemName}" unavailable? Customers will not be able to see or order this item until you make it available again.`
        : `Are you sure you want to make "${itemName}" available? Customers will be able to see and order this item.`,
      confirmText: isMakingUnavailable ? 'Make Unavailable' : 'Make Available',
      cancelText: 'Cancel',
      type: isMakingUnavailable ? 'warning' : 'info',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });
        await performToggleAvailability(itemId, currentStatus);
      },
    });
  };

  const performToggleAvailability = async (itemId, currentStatus) => {
    try {
      const response = await menuApi.updateMenuItem(itemId, { is_available: !currentStatus });
      if (response.success) {
        toast.success(`Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      preparation_time: '',
      is_available: true,
    });
    setErrors({});
    setEditingItem(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  // Filter menu items
  const filteredMenuByCategory = Object.keys(menuByCategory).reduce((acc, category) => {
    let items = menuByCategory[category];

    // Apply filters
    if (categoryFilter && category !== categoryFilter) {
      return acc;
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by availability
    // When "All Items" is selected (empty filter), show all items
    // When specific filter is selected, filter accordingly
    if (availabilityFilter === 'available') {
      items = items.filter((item) => item.is_available);
    } else if (availabilityFilter === 'unavailable') {
      items = items.filter((item) => !item.is_available);
    }
    // If availabilityFilter is empty ("All Items"), don't filter - show all items

    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {});

  if (isLoading && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/restaurant/dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Manage Menu</h1>
                {restaurant && (
                  <p className="text-sm text-gray-500">{restaurant.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Menu Item
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Menu Items by Category */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        ) : Object.keys(filteredMenuByCategory).length > 0 ? (
          <div className="space-y-8">
            {Object.keys(filteredMenuByCategory).map((category) => (
              <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  {category}
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredMenuByCategory[category].length} items)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenuByCategory[category].map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        // Only apply opacity when showing all items or available items, not when explicitly viewing unavailable
                        !item.is_available && availabilityFilter !== 'unavailable' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.description || 'No description'}
                          </p>
                        </div>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg ml-2"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-orange-600">
                          ₹{parseFloat(item.price || 0).toFixed(2)}
                        </span>
                        {item.preparation_time && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {item.preparation_time} min
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.is_available, item.name)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No menu items found</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery || categoryFilter || availabilityFilter
                ? 'Try adjusting your filters'
                : 'Get started by adding your first menu item'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Menu Item
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Margherita Pizza"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe your menu item..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Pizza, Pasta, Drinks"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preparation_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="preparation_time"
                    name="preparation_time"
                    value={formData.preparation_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        errors.image_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {errors.image_url && <p className="mt-1 text-sm text-red-500">{errors.image_url}</p>}
                  {formData.image_url && !errors.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'danger' 
                    ? 'bg-red-100' 
                    : confirmModal.type === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}>
                  {confirmModal.type === 'danger' ? (
                    <Trash2 className={`w-6 h-6 ${
                      confirmModal.type === 'danger' ? 'text-red-600' : ''
                    }`} />
                  ) : confirmModal.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  {confirmModal.cancelText}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmModal.type === 'danger'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : confirmModal.type === 'warning'
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
