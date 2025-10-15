import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import UserService from '../../../model/business_logic/services/UserService';
import Button from './Button';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    bio: '',
    avatar_url: null // Agregar avatar_url al estado del formulario
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      // Cargar datos del perfil del usuario
      loadUserProfile();
    }
  }, [isOpen, user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profileData = await UserService.getUserProfile(user.id);
      if (profileData) {
        // Convertir la fecha ISO a formato YYYY-MM-DD para el input date
        let formattedBirthDate = '';
        if (profileData.birth_date) {
          const date = new Date(profileData.birth_date);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString().split('T')[0];
          }
        }

        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          birth_date: formattedBirthDate,
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || null // Preservar avatar_url
        });
      }
    } catch (error) {
      console.log('No se pudo cargar el perfil, usando valores por defecto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Crear objeto de datos sin avatar_url para evitar sobrescribirlo
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        birth_date: formData.birth_date,
        bio: formData.bio
        // Deliberadamente NO incluir avatar_url
      };

      console.log('📋 Actualizando perfil (sin avatar_url):', updateData);
      await UserService.updateUserProfile(user.id, updateData);
      setSuccess('Perfil actualizado exitosamente');
      
      // Actualizar el contexto del usuario si es necesario
      if (updateUser) {
        updateUser({
          ...user,
          first_name: formData.first_name,
          last_name: formData.last_name
        });
      }
      
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mi Perfil</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Información básica del usuario */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Información de cuenta</h3>
            <p className="text-sm text-gray-600">Usuario: <span className="font-medium">{user?.username}</span></p>
            <p className="text-sm text-gray-600">Email: <span className="font-medium">{user?.email}</span></p>
            <p className="text-sm text-gray-600">Rol: <span className="font-medium capitalize">{user?.role}</span></p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tu número de teléfono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Cuéntanos algo sobre ti..."
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;