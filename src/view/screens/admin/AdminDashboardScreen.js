import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminViewModel from '../../../viewModel/admin/AdminViewModel';
import ReportsViewModel from '../../../viewModel/admin/ReportsViewModel'; // Importar el ViewModel de reportes
import UserService from '../../../model/business_logic/services/UserService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProfileModal from '../../components/common/ProfileModal';
import ImageSelectorModal from '../../components/common/ImageSelectorModal';

const DashboardProfileSection = ({ user, userProfile, onOpenProfile, onOpenImageSelector }) => {
  // Verificar si hay información del perfil para mostrar
  const hasProfileInfo = userProfile && (
    userProfile.first_name || 
    userProfile.last_name || 
    userProfile.phone || 
    userProfile.bio ||
    userProfile.birth_date
  );

  // Función para calcular la edad
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    
    const today = new Date();
    let birth;
    
    // Intentar parsear la fecha de diferentes maneras
    if (typeof birthDate === 'string') {
      birth = new Date(birthDate);
      
      // Si el parseo falla, intentar con formato ISO
      if (isNaN(birth.getTime())) {
        birth = new Date(birthDate + 'T00:00:00');
      }
    } else {
      birth = new Date(birthDate);
    }
    
    // Verificar que la fecha de nacimiento sea válida
    if (isNaN(birth.getTime())) {
      return null;
    }
    
    // Usar solo las fechas sin tiempo para evitar problemas de zona horaria
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    const birthYear = birth.getFullYear();
    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate();
    
    let age = todayYear - birthYear;
    
    // Si el cumpleaños de este año aún no ha pasado
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
      age--;
    }
    
    // Asegurar que la edad no sea negativa
    return age >= 0 ? age : null;
  };

  const age = calculateAge(userProfile?.birth_date);

  return (
    <Card className="flex flex-col gap-6 p-8 bg-gradient-to-r from-indigo-50 to-pink-50 shadow-lg relative">
      {/* Badge de Rol - Posicionado en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg animate-pulse">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727-.001L15 5.102a1 1 0 01.657.924V14a1 1 0 01-.656.924l-5.029 2.073a1 1 0 01-.728 0L4.343 14.924A1 1 0 014 14V6.026a1 1 0 01.657-.924L9.243 3.03zM10 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
          </svg>
          {user?.role?.toUpperCase() || 'ADMIN'}
        </span>
      </div>

      {/* Sección superior con avatar y botón */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          {/* Contenedor del avatar con botón de cambio */}
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full w-32 h-32 flex items-center justify-center shadow-md overflow-hidden">
              {userProfile?.avatar_url ? (
                <img 
                  src={`http://localhost:5003${userProfile.avatar_url}`} 
                  alt="Avatar de perfil"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Si la imagen falla al cargar, mostrar la letra
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span 
                className={`text-white text-5xl font-bold select-none ${userProfile?.avatar_url ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
              >
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            
            {/* Botón + para cambiar imagen */}
            <button
              onClick={onOpenImageSelector}
              className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              title="Cambiar foto de perfil"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-indigo-700 mb-1">{user?.username || 'Admin'}</h2>
          </div>
        </div>
        <div className="flex flex-col gap-3 items-center md:items-end flex-1">
          <Button 
            className="btn px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={onOpenProfile}
          >
            Ver Perfil
          </Button>
        </div>
      </div>

      {/* Información del perfil (solo si existe) */}
      {hasProfileInfo && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Información del Perfil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(userProfile.first_name || userProfile.last_name) && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">
                  {[userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            
            {userProfile.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-sm text-gray-700">{userProfile.phone}</span>
              </div>
            )}

            {age !== null && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{age} años</span>
              </div>
            )}
            
            {userProfile.bio && (
              <div className="md:col-span-2">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-indigo-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 leading-relaxed">{userProfile.bio}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

const DashboardStatsSection = ({ stats, loading, error }) => {
  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error al cargar estadísticas: {error}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-indigo-500">{stats?.totalUsers ?? 0}</span>
        <span className="text-gray-500 mt-2">Usuarios Totales</span>
      </Card>
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-pink-500">{stats?.totalGames ?? 0}</span>
        <span className="text-gray-500 mt-2">Juegos Totales</span>
      </Card>
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-green-500">{stats?.totalPlays ?? 0}</span>
        <span className="text-gray-500 mt-2">Partidas Totales</span>
      </Card>
    </div>
  );
};

const ReportsSection = () => {
  const handleDownloadImageReport = async () => {
    try {
      const result = await ReportsViewModel.downloadImageReport();
      if (result.success) {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_actividad_imagenes.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Error al generar el reporte de imágenes: ${result.error}`);
      }
    } catch (error) {
      alert(`Error inesperado al descargar el reporte de imágenes: ${error.message}`);
    }
  };

  const handleDownloadReport = async (reportType) => {
    try {
      let result;
      const isGameReport = ['ALL_GAMES', 'TOP_10_MOST_PLAYED', 'CREATED_BY_DATE'].includes(reportType);

      if (isGameReport) {
        result = await ReportsViewModel.downloadGameReport(reportType);
      } else {
        result = await ReportsViewModel.downloadUserReport(reportType);
      }

      if (result.success) {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_${reportType.toLowerCase()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Error al generar el reporte: ${result.error}`);
      }
    } catch (error) {
      alert(`Error inesperado al descargar el reporte: ${error.message}`);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4 text-gray-700">Generación de Informes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Informes de Usuarios */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Usuarios</h3>
          <div className="flex flex-col items-start space-y-2">
            <Button onClick={() => handleDownloadReport('ALL_USERS')}>Listado Completo de Usuarios</Button>
            <Button onClick={() => handleDownloadReport('ACTIVE_VS_INACTIVE')}>Usuarios Activos vs. Inactivos</Button>
          </div>
        </div>

        {/* Informes de Juegos */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Juegos</h3>
          <div className="flex flex-col items-start space-y-2">
            <Button onClick={() => handleDownloadReport('ALL_GAMES')}>Listado Completo de Juegos</Button>
            <Button onClick={() => handleDownloadReport('TOP_10_MOST_PLAYED')}>Top 10 Juegos Más Jugados</Button>
            {/* Aquí se podrían añadir botones para otros informes de juegos */}
          </div>
        </div>

        {/* Informes de Imágenes */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Imágenes</h3>
          <div className="flex flex-col items-start space-y-2">
            <Button onClick={handleDownloadImageReport} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg">Generar Reporte de Imágenes</Button>
          </div>
        </div>

      </div>
      <p className="text-xs text-gray-500 mt-4">Nota: Los informes que requieren fechas (ej. por día) necesitarán un selector de fechas que se puede añadir en el futuro.</p>
    </Card>
  );
};

const AdminDashboardScreen = () => {
  const { user } = useAuth(); // Obtener el usuario real del contexto
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [imageSelectorModalOpen, setImageSelectorModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // Trackear el usuario actual

  // Limpiar estado cuando cambia el usuario
  useEffect(() => {
    if (user?.id !== currentUserId) {
      console.log(`🔄 Usuario cambió de ${currentUserId} a ${user?.id}, limpiando estado`);
      setCurrentUserId(user?.id);
      setUserProfile(null);
      setStats(null);
      setError('');
      setLoading(true);
    }
  }, [user?.id, currentUserId]);

  useEffect(() => {
    console.log('🔄 AdminDashboard useEffect triggered. User:', user?.id, user?.username);
    
    const getStats = async () => {
      setLoading(true);
      const result = await AdminViewModel.fetchDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    const getUserProfile = async () => {
      if (user?.id) {
        console.log(`📋 Cargando perfil para usuario ${user.id} (${user.username})`);
        try {
          const profileData = await UserService.getUserProfile(user.id);
          console.log('✅ Perfil cargado:', profileData);
          setUserProfile(profileData);
        } catch (error) {
          console.error('❌ Error cargando perfil:', error.message);
          // Si no hay perfil o hay error, limpiar estado
          setUserProfile(null);
        }
      } else {
        console.log('⚠️ No hay usuario, limpiando perfil');
        setUserProfile(null);
      }
    };

    // Solo ejecutar si hay usuario autenticado
    if (user?.id) {
      getStats();
      getUserProfile();
    } else {
      // Si no hay usuario, limpiar estados
      setStats(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, [user?.id, user?.username]); // Dependencias más específicas

  const handleOpenProfile = () => {
    setProfileModalOpen(true);
  };

  const handleCloseProfile = async () => {
    setProfileModalOpen(false);
    // Recargar el perfil después de cerrar el modal para mostrar cambios
    if (user?.id) {
      console.log(`🔄 Recargando perfil después de cerrar modal para usuario ${user.id}`);
      try {
        const profileData = await UserService.getUserProfile(user.id);
        console.log('✅ Perfil recargado después de modal:', profileData);
        setUserProfile(profileData);
      } catch (error) {
        console.error('❌ Error recargando perfil después de modal:', error.message);
        setUserProfile(null);
      }
    }
  };

  const handleOpenImageSelector = () => {
    setImageSelectorModalOpen(true);
  };

  const handleCloseImageSelector = () => {
    setImageSelectorModalOpen(false);
  };

  const handleImageSelected = async (imageUrl) => {
    console.log(`🖼️ Imagen seleccionada para usuario ${user?.id}:`, imageUrl);
    
    // Actualizar el perfil local con la nueva imagen
    setUserProfile(prev => ({
      ...prev,
      avatar_url: imageUrl
    }));

    // Opcional: Recargar perfil completo para asegurar consistencia
    if (user?.id) {
      try {
        const updatedProfile = await UserService.getUserProfile(user.id);
        console.log('✅ Perfil actualizado después de cambio de imagen:', updatedProfile);
        setUserProfile(updatedProfile);
      } catch (error) {
        console.error('⚠️ Error recargando perfil después de cambio de imagen:', error.message);
        // Mantener el cambio local si falla la recarga
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <DashboardProfileSection 
        user={user} 
        userProfile={userProfile}
        onOpenProfile={handleOpenProfile}
        onOpenImageSelector={handleOpenImageSelector}
      />
      <DashboardStatsSection stats={stats} loading={loading} error={error} />
      <ReportsSection />
      
      {/* Modal de Perfil */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={handleCloseProfile} 
      />

      {/* Modal de Selector de Imágenes */}
      <ImageSelectorModal
        isOpen={imageSelectorModalOpen}
        onClose={handleCloseImageSelector}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};

export default AdminDashboardScreen;