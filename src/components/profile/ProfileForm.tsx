import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { UserRound } from 'lucide-react';

const ProfileForm: React.FC = () => {
  const { user, updateProfile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error and success when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (isSuccess) {
      setIsSuccess(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await updateProfile(
        formData.name,
        formData.password || undefined
      );
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
      setIsSuccess(true);
    }
  };
  
  if (!user) {
    return null;
  }
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return dayjs(dateString).format('MMMM D, YYYY');
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card>
        <Card.Header>
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-full mr-3">
              <UserRound className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          </div>
        </Card.Header>
        
        <Card.Content>
          <div className="space-y-6">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Account Information</h3>
              <div className="mt-2 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.dob)}</dd>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-gray-500 text-sm font-medium mb-4">Update Profile</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {isSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm">
                      Profile updated successfully!
                    </div>
                  )}
                  
                  <Input
                    label="Name"
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />
                  
                  <Input
                    label="New Password (leave empty to keep current)"
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                  />
                  
                  <Input
                    label="Confirm New Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    disabled={!formData.password}
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ProfileForm;