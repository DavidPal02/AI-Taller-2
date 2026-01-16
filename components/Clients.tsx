import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Client, Vehicle } from '../types';
import { Search, Phone, Mail, MapPin, Car } from 'lucide-react';
import { motion } from 'framer-motion';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const [cData, vData] = await Promise.all([
        dbService.getClients(),
        dbService.getVehicles()
      ]);
      setClients(cData);
      setVehicles(vData);
    };
    fetch();
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20">
          <span className="font-medium">+ Nuevo Cliente</span>
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 custom-scrollbar">
        {filteredClients.map((client, i) => {
          const clientCars = getClientVehicles(client.id);

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-6 rounded-2xl group transition-all hover:border-blue-500/50 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
                  <span className="text-xs text-slate-500">ID: {client.id}</span>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-slate-300 mb-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {client.email}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {client.address || 'Sin dirección'}
                </div>
              </div>

              <div className="mt-auto border-t border-slate-700 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Car className="w-3 h-3" /> Vehículos Asociados ({clientCars.length})
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

              <div className="mt-4 pt-2 flex justify-end">
                <button className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline">Ver Historial Completo &rarr;</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};