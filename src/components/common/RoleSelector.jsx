import { User, Store, Bike } from 'lucide-react';

const roles = [
  {
    id: 'customer',
    label: 'Customer',
    description: 'Order food from restaurants',
    icon: User,
  },
  {
    id: 'restaurant_owner',
    label: 'Restaurant',
    description: 'Manage your restaurant',
    icon: Store,
  },
  {
    id: 'rider',
    label: 'Rider',
    description: 'Deliver orders & earn',
    icon: Bike,
  },
];

const RoleSelector = ({ selectedRole, onSelect }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        I want to join as <span className="text-red-500">*</span>
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center text-center
                ${isSelected 
                  ? 'border-orange-500 bg-orange-50 text-orange-600' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">{role.label}</span>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                {role.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
