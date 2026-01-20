
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Client, Vehicle } from '../types';
import { Search, Phone, Mail, MapPin, Car, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, clientId: string | null }>({ isOpen: false, clientId: null });
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cData, vData] = await Promise.all([
      dbService.getClients(),
      dbService.getVehicles()
    ]);
    setClients(cData);
    setVehicles(vData);
  };

  const handleAddClient = async () => {
    if (!newClient.name) return;

    if (isEditMode && editingClientId) {
      const client: Client = {
        id: editingClientId,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address,
        createdAt: clients.find(c => c.id === editingClientId)?.createdAt || new Date().toISOString()
      };
      await dbService.updateClient(client);
      setClients(clients.map(c => c.id === editingClientId ? client : c));
    } else {
      const client: Client = {
        id: crypto.randomUUID(),
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address,
        createdAt: new Date().toISOString()
      };
      await dbService.addClient(client);
      setClients([client, ...clients]);
    }

    setIsModalOpen(false);
    setIsEditMode(false);
    setNewClient({ name: '', phone: '', email: '', address: '' });
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, clientId: id });
  };

  const confirmDelete = async () => {
    if (deleteModal.clientId) {
      await dbService.deleteClient(deleteModal.clientId);
      setClients(clients.filter(c => c.id !== deleteModal.clientId));
      setDeleteModal({ isOpen: false, clientId: null });
    }
  };

  const openEditModal = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setNewClient({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || ''
    });
    setEditingClientId(client.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const getClientVehicles = (clientId: string) => {
    return vehicles.filter(v => v.clientId === clientId);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Clientes</h2>
          <p className="text-slate-400 mt-1">Directorio de propietarios de vehículos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nuevo Cliente</span>
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 custom-scrollbar flex-1">
        {filteredClients.map((client, i) => {
          const clientCars = getClientVehicles(client.id);

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-6 rounded-2xl group transition-all hover:border-blue-500/50 flex flex-col h-fit"
            >
              <div className="flex items-start gap-4 mb-4 relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0 ${i % 4 === 0 ? 'bg-blue-500 shadow-blue-500/20' :
                    i % 4 === 1 ? 'bg-purple-500 shadow-purple-500/20' :
                      i % 4 === 2 ? 'bg-emerald-500 shadow-emerald-500/20' :
                        'bg-rose-500 shadow-rose-500/20'
                  }`}>
                  {client.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{client.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {client.id.slice(0, 8)}</span>
                </div>
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 border border-slate-700 shadow-xl">
                  <button
                    onClick={(e) => openEditModal(e, client)}
                    className="p-1.5 hover:bg-blue-500/20 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button
                    onClick={(e) => requestDelete(e, client.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-300 mb-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {client.email || 'No especificado'}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{client.address || 'Sin dirección'}</span>
                </div>
              </div>

              <div className="mt-auto border-t border-slate-700 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Car className="w-3 h-3" /> Vehículos ({clientCars.length})
                </h4>
                <div className="space-y-2">
                  {clientCars.length > 0 ? (
                    clientCars.map(car => (
                      <div key={car.id} className="bg-slate-900/50 rounded-lg p-2 text-xs flex justify-between items-center border border-slate-700/50">
                        <span className="text-slate-300">{car.make} {car.model}</span>
                        <span className="font-mono text-blue-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">{car.plate}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 italic">No tiene vehículos registrados.</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="text-slate-400 hover:text-white"><X /></button>
              </div>
              <div className="space-y-4">
                <input
                  placeholder="Nombre Completo"
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                />
                <input
                  placeholder="Teléfono"
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
                  value={newClient.phone}
                  onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                />
                <input
                  placeholder="Email"
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                />
                <input
                  placeholder="Dirección"
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
                  value={newClient.address}
                  onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="text-slate-400 px-4 py-2">Cancelar</button>
                <button onClick={handleAddClient} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">{isEditMode ? 'Guardar Cambios' : 'Crear'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">¿Eliminar cliente?</h3>
              <p className="text-slate-400 text-center text-sm mb-6">
                Esta acción eliminará permanentemente al cliente, así como todos sus <strong>vehículos, trabajos y gastos</strong> asociados. No se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, clientId: null })}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};
