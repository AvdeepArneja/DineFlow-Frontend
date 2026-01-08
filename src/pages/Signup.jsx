import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShoppingBag, Building2, Bike, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const user = await signup(formData);
      
      toast.success(`Account created successfully! Please login to continue.`);
      
      // Redirect to login page after successful signup
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'customer',
      label: 'Customer',
      icon: ShoppingBag,
    },
    {
      id: 'restaurant_owner',
      label: 'Restaurant',
      icon: Building2,
    },
    {
      id: 'rider',
      label: 'Rider',
      icon: Bike,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Sign Up Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                Sign Up
              </h1>
              <p className="text-gray-500 mb-8">Create your account</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className={`
                        w-full pl-12 pr-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                        ${errors.name ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className={`
                        w-full pl-12 pr-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                        ${errors.email ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      className={`
                        w-full pl-12 pr-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                        ${errors.password ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sign Up As:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = formData.role === role.id;
                      
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleRoleSelect(role.id)}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all duration-200
                            flex flex-col items-center justify-center
                            ${isSelected 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-green-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                          <Icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-green-600' : 'text-gray-700'}`}>
                            {role.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
              </form>

              {/* Login Link */}
              <p className="mt-6 text-center text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-red-500 font-semibold hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>

          {/* Right Section - Illustrative Graphic */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 p-8 lg:p-12 relative overflow-hidden">
            {/* City Skyline Background */}
            <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
              <svg viewBox="0 0 1200 120" className="w-full h-full">
                <rect x="0" y="60" width="80" height="60" fill="#4A5568" />
                <rect x="100" y="40" width="60" height="80" fill="#4A5568" />
                <rect x="180" y="70" width="70" height="50" fill="#4A5568" />
                <rect x="270" y="30" width="90" height="90" fill="#4A5568" />
                <rect x="380" y="50" width="80" height="70" fill="#4A5568" />
                <rect x="480" y="20" width="100" height="100" fill="#4A5568" />
                <rect x="600" y="60" width="70" height="60" fill="#4A5568" />
                <rect x="690" y="40" width="80" height="80" fill="#4A5568" />
                <rect x="790" y="80" width="60" height="40" fill="#4A5568" />
                <rect x="870" y="30" width="90" height="90" fill="#4A5568" />
                <rect x="980" y="50" width="80" height="70" fill="#4A5568" />
                <rect x="1080" y="70" width="70" height="50" fill="#4A5568" />
              </svg>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-center items-center space-y-12">
              {/* Customer Ordering */}
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-full p-6 shadow-lg mb-4">
                  <div className="relative">
                    {/* Customer Avatar */}
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-red-500" />
                    </div>
                    {/* Phone with Food Icon */}
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-lg p-2 shadow-md">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">🍔</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 font-medium">Order Food</p>
              </div>

              {/* Restaurant Preparation */}
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-full p-6 shadow-lg mb-4 relative">
                  {/* Chef Avatar */}
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-blue-500" />
                  </div>
                  
                  {/* Notification Bubbles */}
                  <div className="absolute -top-2 -left-4">
                    <div className="bg-green-500 text-white rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-md">
                      <Check className="w-3 h-3" />
                      Order Confirmed!
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-4">
                    <div className="bg-red-500 text-white rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-md">
                      <span>↓</span>
                      Pickup in 10 mins
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 font-medium">Restaurant Prepares</p>
              </div>

              {/* Delivery */}
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-full p-6 shadow-lg mb-4">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Bike className="w-12 h-12 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">Fast Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
