import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const user = await login(formData);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on user role
      const dashboardRoutes = {
        customer: '/home',
        restaurant_owner: '/restaurant/dashboard',
        rider: '/rider/dashboard',
      };
      const redirectPath = dashboardRoutes[user.role] || '/home';
      navigate(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-red-500 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-white">
            <UtensilsCrossed className="w-10 h-10" />
            <span className="text-3xl font-bold">Dineflow</span>
          </div>
        </div>
        
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">
            Delicious food,<br />delivered to you
          </h1>
          <p className="text-orange-100 text-lg">
            Order from the best restaurants in your city
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
            <p className="text-3xl font-bold">500+</p>
            <p className="text-sm">Restaurants</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
            <p className="text-3xl font-bold">10k+</p>
            <p className="text-sm">Happy Customers</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
            <p className="text-3xl font-bold">50+</p>
            <p className="text-sm">Cities</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-800">Dineflow</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
            <p className="text-gray-500 mt-2">Sign in to continue to Dineflow</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={Mail}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              icon={Lock}
              error={errors.password}
              required
            />

            <div className="flex justify-end mb-6">
              <Link 
                to="/forgot-password" 
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-orange-500 font-semibold hover:text-orange-600"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
