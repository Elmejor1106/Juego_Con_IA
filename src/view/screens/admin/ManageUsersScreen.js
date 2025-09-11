import React, { useState, useEffect, useCallback } from 'react';
import AdminViewModel from '../../../viewModel/admin/AdminViewModel';

// --- Componente del Modal para Crear/Editar Usuario ---
const UserFormModal = ({ isOpen, onClose, onSubmit, user, isSubmitting }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // La contraseña no se precarga por seguridad
        role: user.role || 'user',
        status: user.status || 'active',
      });
    } else {
      setFormData({ username: '', email: '', password: '', role: 'user', status: 'active' });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Nombre de usuario" className="w-full px-4 py-2 border rounded-lg" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-4 py-2 border rounded-lg" required />
            {!user && (
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" className="w-full px-4 py-2 border rounded-lg" required />
            )}
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end mt-8 space-x-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-sky-300">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente Principal de la Pantalla ---
const ManageUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    console.log('[ManageUsersScreen] Iniciando fetchUsers...');
    setLoading(true);
    const result = await AdminViewModel.fetchAllUsers();
    console.log('[ManageUsersScreen] Resultado de fetchAllUsers:', result);
    if (result.success) {
      setUsers(result.data);
    } else {
      console.error('[ManageUsersScreen] Error al obtener usuarios:', result.message);
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log('[ManageUsersScreen] Componente montado, llamando a fetchUsers.');
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmitForm = async (formData) => {
    setIsSubmitting(true);
    let result;
    if (selectedUser) {
      // Lógica de edición
      const dataToUpdate = { ...formData };
      delete dataToUpdate.password; // No enviar la contraseña si está vacía
      if (!formData.password) delete dataToUpdate.password;
      result = await AdminViewModel.editUser(selectedUser.id, dataToUpdate);
    } else {
      // Lógica de creación
      result = await AdminViewModel.addNewUser(formData);
    }

    if (result.success) {
      await fetchUsers(); // Recargar la lista de usuarios
      handleCloseModal();
    } else {
      alert(`Error: ${result.message}`);
    }
    setIsSubmitting(false);
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar a este usuario?')) {
      const result = await AdminViewModel.deactivateUser(userId);
      if (result.success) {
        fetchUsers();
      } else {
        alert(`Error: ${result.message}`);
      }
    }
  };

  if (loading) return <div className="p-8">Cargando usuarios...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600">
          + Añadir Usuario
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{user.username}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {user.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => handleOpenModal(user)} className="text-sky-600 hover:text-sky-900">Editar</button>
                  <button onClick={() => handleDeactivate(user.id)} className="text-red-600 hover:text-red-900">Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSubmitForm} 
        user={selectedUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ManageUsersScreen;
