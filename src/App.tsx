/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Wind, 
  Droplets, 
  Zap, 
  Utensils, 
  Users, 
  Coins, 
  Plus, 
  AlertTriangle, 
  Info,
  Rocket,
  Sun,
  ShieldAlert,
  Activity
} from "lucide-react";

interface Resources {
  oxygen: number;
  water: number;
  energy: number;
  food: number;
  credits: number;
  population: number;
}

interface Building {
  id: string;
  name: string;
  count: number;
  cost: Partial<Resources>;
  production: Partial<Resources>;
  consumption: Partial<Resources>;
  icon: any;
  description: string;
}

const INITIAL_RESOURCES: Resources = {
  oxygen: 100,
  water: 100,
  energy: 100,
  food: 100,
  credits: 1000,
  population: 5,
};

const BUILDINGS_DATA: Building[] = [
  {
    id: 'solar',
    name: 'Panneaux Solaires',
    count: 1,
    cost: { credits: 200 },
    production: { energy: 5 },
    consumption: {},
    icon: Sun,
    description: 'Génère de l\'énergie grâce au soleil martien.'
  },
  {
    id: 'water',
    name: 'Extracteur d\'Eau',
    count: 1,
    cost: { credits: 300, energy: 10 },
    production: { water: 3 },
    consumption: { energy: 2 },
    icon: Droplets,
    description: 'Extrait l\'eau des glaces souterraines.'
  },
  {
    id: 'oxygen',
    name: 'Générateur d\'Oxygène',
    count: 1,
    cost: { credits: 400, energy: 15 },
    production: { oxygen: 4 },
    consumption: { energy: 3 },
    icon: Wind,
    description: 'Convertit le CO2 en oxygène respirable.'
  },
  {
    id: 'greenhouse',
    name: 'Serre Hydroponique',
    count: 1,
    cost: { credits: 500, water: 20 },
    production: { food: 6 },
    consumption: { water: 4, energy: 2 },
    icon: Utensils,
    description: 'Produit de la nourriture pour les colons.'
  },
  {
    id: 'hab',
    name: 'Module d\'Habitation',
    count: 1,
    cost: { credits: 800, oxygen: 30 },
    production: { population: 5 },
    consumption: { oxygen: 2, water: 2, food: 2 },
    icon: Users,
    description: 'Permet d\'accueillir plus de colons.'
  }
];

export default function App() {
  const [resources, setResources] = useState<Resources>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<Building[]>(BUILDINGS_DATA);
  const [day, setDay] = useState(1);
  const [logs, setLogs] = useState<string[]>(["Bienvenue sur Mars, Commandant. La colonie est opérationnelle."]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeEvent, setActiveEvent] = useState<{title: string, desc: string} | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const tick = useCallback(() => {
    if (isGameOver) return;

    setResources(prev => {
      const next = { ...prev };
      
      // Calculate production and consumption
      buildings.forEach(b => {
        if (b.count > 0) {
          // Production
          Object.entries(b.production).forEach(([res, val]) => {
            if (res !== 'population') {
              (next as any)[res] += (val as number) * b.count;
            }
          });
          // Consumption
          Object.entries(b.consumption).forEach(([res, val]) => {
            (next as any)[res] -= (val as number) * b.count;
          });
        }
      });

      // Population consumption (base)
      next.oxygen -= next.population * 0.5;
      next.water -= next.population * 0.5;
      next.food -= next.population * 0.5;
      next.energy -= 2; // Base base load

      // Check for game over
      if (next.oxygen <= 0 || next.water <= 0 || next.food <= 0 || next.energy <= 0) {
        setIsGameOver(true);
        addLog("CRITIQUE : Ressources épuisées. La mission a échoué.");
      }

      // Cap resources
      next.oxygen = Math.max(0, Math.min(next.oxygen, 1000));
      next.water = Math.max(0, Math.min(next.water, 1000));
      next.energy = Math.max(0, Math.min(next.energy, 1000));
      next.food = Math.max(0, Math.min(next.food, 1000));

      return next;
    });

    setDay(d => d + 1);

    // Random events
    if (Math.random() < 0.05) {
      triggerEvent();
    }
  }, [buildings, isGameOver]);

  useEffect(() => {
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [tick]);

  const triggerEvent = () => {
    const events = [
      { title: "Tempête de Poussière", desc: "La production d'énergie solaire est réduite.", effect: () => setResources(r => ({...r, energy: r.energy - 20})) },
      { title: "Fuite d'Oxygène", desc: "Un joint a lâché dans le secteur 4.", effect: () => setResources(r => ({...r, oxygen: r.oxygen - 30})) },
      { title: "Arrivée de Ravitaillement", desc: "La Terre a envoyé des crédits supplémentaires.", effect: () => setResources(r => ({...r, credits: r.credits + 500})) },
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    setActiveEvent({ title: event.title, desc: event.desc });
    event.effect();
    addLog(`ALERTE : ${event.title}`);
    setTimeout(() => setActiveEvent(null), 5000);
  };

  const buyBuilding = (id: string) => {
    const building = buildings.find(b => b.id === id);
    if (!building) return;

    // Check costs
    const canAfford = Object.entries(building.cost).every(([res, val]) => (resources as any)[res] >= (val as number));

    if (canAfford) {
      setResources(prev => {
        const next = { ...prev };
        Object.entries(building.cost).forEach(([res, val]) => {
          (next as any)[res] -= (val as number);
        });
        if (building.id === 'hab') {
          next.population += 5;
        }
        return next;
      });

      setBuildings(prev => prev.map(b => b.id === id ? { ...b, count: b.count + 1 } : b));
      addLog(`Construction : ${building.name} ajouté.`);
    } else {
      addLog("Erreur : Ressources insuffisantes pour construire.");
    }
  };

  const ResourceCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</p>
        <p className="text-xl font-mono font-bold">{Math.floor(value)}</p>
      </div>
    </div>
  );

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center space-y-8"
        >
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter">MISSION ÉCHOUÉE</h1>
          <p className="text-gray-400">La colonie a succombé aux conditions hostiles de Mars au jour {day}.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-red-500 hover:text-white transition-all"
          >
            Recommencer la Mission
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans p-6 md:p-10">
      {/* HUD Overlay */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-50" />
      
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Resources & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <header className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
                <Rocket className="text-orange-500" />
                MARS-1 COLONY
              </h1>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Sol {day} • Status: Opérationnel</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <ResourceCard label="Oxygène" value={resources.oxygen} icon={Wind} color="bg-blue-500" />
            <ResourceCard label="Eau" value={resources.water} icon={Droplets} color="bg-cyan-500" />
            <ResourceCard label="Énergie" value={resources.energy} icon={Zap} color="bg-yellow-500" />
            <ResourceCard label="Nourriture" value={resources.food} icon={Utensils} color="bg-green-500" />
            <ResourceCard label="Colons" value={resources.population} icon={Users} color="bg-purple-500" />
            <ResourceCard label="Crédits" value={resources.credits} icon={Coins} color="bg-orange-500" />
          </div>

          {/* Logs */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 h-64 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Journal de Mission</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
              {logs.map((log, i) => (
                <p key={i} className={i === 0 ? "text-orange-500" : "text-gray-500"}>
                  <span className="opacity-30 mr-2">[{day}]</span> {log}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Construction */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence>
            {activeEvent && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-6"
              >
                <div className="p-4 bg-red-500 rounded-2xl">
                  <AlertTriangle className="text-white w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-500">{activeEvent.title}</h3>
                  <p className="text-sm text-red-400/80">{activeEvent.desc}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buildings.map((b) => (
              <div key={b.id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 hover:border-orange-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-orange-500/10 transition-colors">
                    <b.icon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{b.count}</span>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Unités</p>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{b.name}</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{b.description}</p>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(b.cost).map(([res, val]) => (
                      <span key={res} className="text-[10px] bg-white/5 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                        {val} {res}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => buyBuilding(b.id)}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Construire
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-3xl flex items-start gap-4">
            <Info className="w-6 h-6 text-orange-500 shrink-0" />
            <div className="text-sm text-gray-400 leading-relaxed">
              <p className="font-bold text-orange-500 mb-1 uppercase tracking-widest text-xs">Conseil du Commandant</p>
              Chaque colon consomme 0.5 unité d'oxygène, d'eau et de nourriture par cycle. Assurez-vous que votre production dépasse toujours la consommation totale de votre population pour éviter une catastrophe.
            </div>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="mt-20 text-center opacity-20">
        <p className="text-[10px] uppercase tracking-[0.5em]">Ares Initiative • Mars Colonization Program • 2026</p>
      </footer>
    </div>
  );
}
