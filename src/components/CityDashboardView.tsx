import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, addDoc, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { City } from '@/src/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Star, ChevronRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/src/lib/swal';
import { cn } from '@/lib/utils';

interface CityDashboardViewProps {
  onCityClick?: (cityId: string) => void;
}
 
export const CityDashboardView: React.FC<CityDashboardViewProps> = ({ onCityClick }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const q = query(collection(db, 'cities'), orderBy('name'));
        const snapshot = await firestoreGetDocs(q);
        setCities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'cities');
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-muted rounded-2xl" />
        ))}
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="premium-card p-20 flex flex-col items-center text-center gap-8 border-dashed border-2 border-border/50 bg-muted/20">
        <div className="stat-icon-glow bg-primary/10 text-primary w-24 h-24 mb-0 scale-125">
          <Compass className="h-10 w-10 animate-spin-slow" />
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-2xl font-black tracking-tight text-text-main">استكشف آفاقاً جديدة</h3>
          <p className="text-sm text-text-muted font-bold leading-relaxed">لم يتم العثور على أي وجهات نشطة حالياً. ابدأ بإضافة مدنك لتظهر هنا بشكل فاخر.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {cities.map((city, idx) => (
          <motion.div
            key={city.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative h-[320px] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-700 cursor-pointer"
            onClick={() => onCityClick?.(city.id)}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={city.city_img || 'https://picsum.photos/seed/city/800/1000'} 
                alt={city.name} 
                className="w-full h-full object-cover transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
            </div>

            <div className="absolute top-6 right-6 z-10">
              {city.isFeatured && (
                <div className="bg-warning/90 backdrop-blur-md text-black px-4 py-1.5 rounded-2xl flex items-center gap-2 transform -rotate-3 transition-transform group-hover:rotate-0">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">تميز</span>
                </div>
              )}
            </div>

            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-2 text-white/50 group-hover:text-white/80 transition-colors">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] uppercase font-black tracking-[0.3em]">الوجهات المختارة</span>
                </div>
                <h4 className="text-3xl font-black text-white tracking-tight">{city.name}</h4>
                
                {/* Removed hover avatars and button as per user request */}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
