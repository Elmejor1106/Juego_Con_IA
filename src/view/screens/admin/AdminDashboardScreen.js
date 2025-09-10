
import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const DashboardProfileSection = ({ user }) => (
	<Card className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-r from-indigo-50 to-pink-50 shadow-lg">
		<div className="flex flex-col items-center md:items-start gap-2">
			<div className="bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full w-24 h-24 flex items-center justify-center shadow-md">
				<span className="text-white text-4xl font-bold select-none">
					{user?.username?.[0]?.toUpperCase() || 'U'}
				</span>
			</div>
			<div className="mt-2 text-center md:text-left">
				<h2 className="text-2xl font-bold text-indigo-700 mb-1">{user?.username || 'Usuario'}</h2>
				<p className="text-gray-500 text-sm">{user?.email || 'correo@ejemplo.com'}</p>
			</div>
		</div>
		<div className="flex flex-col gap-3 items-center md:items-end flex-1">
			<Button className="btn px-6 py-2">Editar Perfil</Button>
			<span className="text-xs text-gray-400">Miembro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2025'}</span>
		</div>
	</Card>
);

const DashboardStatsSection = () => (
	<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
		<Card className="flex flex-col items-center justify-center p-6">
			<span className="text-3xl font-bold text-indigo-500">12</span>
			<span className="text-gray-500 mt-2">Juegos Creados</span>
		</Card>
		<Card className="flex flex-col items-center justify-center p-6">
			<span className="text-3xl font-bold text-pink-500">34</span>
			<span className="text-gray-500 mt-2">Juegos Jugados</span>
		</Card>
		<Card className="flex flex-col items-center justify-center p-6">
			<span className="text-3xl font-bold text-green-500">8</span>
			<span className="text-gray-500 mt-2">Logros</span>
		</Card>
	</div>
);

const AdminDashboardScreen = () => {
	// Simulación de usuario (reemplazar por datos reales del contexto)
	const user = {
		username: 'alexis',
		email: 'alexis@email.com',
		createdAt: '2024-01-15',
	};

	return (
		<div className="flex flex-col gap-8">
			<DashboardProfileSection user={user} />
			<DashboardStatsSection />
			{/* Aquí puedes agregar más secciones: últimos juegos, reportes, etc. */}
		</div>
	);
};

export default AdminDashboardScreen;