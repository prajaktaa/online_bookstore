import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateProfile, changePassword, loading, error, clearError } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    phoneNumber: '',
    addresses: []
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        addresses: user.addresses || []
      });
    }
  }, [user]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) clearError();
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) clearError();
  };

  const validateProfileForm = () => {
    const errors = {};

    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (profileData.phoneNumber && !/^\+?[\d\s-()]+$/.test(profileData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateProfileForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validatePasswordForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const result = await changePassword(passwordData);
      
      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Password change error:', err);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const addAddress = () => {
    setProfileData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          type: 'home',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          isDefault: prev.addresses.length === 0
        }
      ]
    }));
  };

  const updateAddress = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const removeAddress = (index) => {
    setProfileData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-content">
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                  {formErrors.name && (
                    <span className="field-error">{formErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="disabled-field"
                  />
                  <small>Email address cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                  />
                  {formErrors.phoneNumber && (
                    <span className="field-error">{formErrors.phoneNumber}</span>
                  )}
                </div>

                <div className="account-status">
                  <div className="status-item">
                    <span className="status-label">Email Verification:</span>
                    <span className={`status-value ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                      {user.isEmailVerified ? '✅ Verified' : '❌ Not Verified'}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Member Since:</span>
                    <span className="status-value">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Addresses</h3>
                  <button type="button" onClick={addAddress} className="add-button">
                    Add Address
                  </button>
                </div>
                
                {profileData.addresses.map((address, index) => (
                  <div key={index} className="address-item">
                    <div className="address-header">
                      <select
                        value={address.type}
                        onChange={(e) => updateAddress(index, 'type', e.target.value)}
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="address-fields">
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={address.street}
                        onChange={(e) => updateAddress(index, 'street', e.target.value)}
                      />
                      <div className="address-row">
                        <input
                          type="text"
                          placeholder="City"
                          value={address.city}
                          onChange={(e) => updateAddress(index, 'city', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={address.state}
                          onChange={(e) => updateAddress(index, 'state', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={address.zipCode}
                          onChange={(e) => updateAddress(index, 'zipCode', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Country"
                        value={address.country}
                        onChange={(e) => updateAddress(index, 'country', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="tab-content">
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-section">
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formErrors.currentPassword && (
                    <span className="field-error">{formErrors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formErrors.newPassword && (
                    <span className="field-error">{formErrors.newPassword}</span>
                  )}
                  <small className="password-hint">
                    Password must be at least 6 characters with uppercase, lowercase, and number
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <span className="field-error">{formErrors.confirmPassword}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
