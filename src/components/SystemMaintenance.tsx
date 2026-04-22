import React, { useState } from 'react';
import { collection, getDocs as firestoreGetDocs, deleteDoc, doc, collectionGroup, query } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, confirm } from '@/src/lib/swal';
import { Trash2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const SystemMaintenance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ legacyHotels: number; legacyRooms: number; orphans: number } | null>(null);

  const scanDatabase = async () => {
    setLoading(true);
    try {
      // 1. Legacy Top-level data
      const legacyHotels = await firestoreGetDocs(collection(db, 'hotels'));
      const legacyRooms = await firestoreGetDocs(collection(db, 'rooms'));
      
      // 2. Orphaned Sub-data (Hotels/Rooms with missing parent city)
      const allHotelsGroup = await firestoreGetDocs(collectionGroup(db, 'hotels'));
      let orphanedHotels = 0;
      let orphanedRooms = 0;

      // Check each hotel to see if its parent city exists
      for (const hDoc of allHotelsGroup.docs) {
        const pathParts = hDoc.ref.path.split('/');
        if (pathParts[0] === 'cities') {
          const cityId = pathParts[1];
          const hotelId = hDoc.id;
          
          // Using a simple check: if the hotel is in the group but not reachable via its city
          // Actually, in the group query, if the parent doc was deleted, the doc still exists.
          // We check if the City document itself exists
          const citySnap = await firestoreGetDocs(query(collection(db, 'cities')));
          const cityExists = citySnap.docs.some(d => d.id === cityId);
          
          if (!cityExists) {
            orphanedHotels++;
            // Also count its rooms
            const roomsSnap = await firestoreGetDocs(collection(db, 'cities', cityId, 'hotels', hotelId, 'rooms'));
            orphanedRooms += roomsSnap.size;
          }
        }
      }
      
      setStats({
        legacyHotels: legacyHotels.size + orphanedHotels,
        legacyRooms: legacyRooms.size + orphanedRooms,
        orphans: orphanedHotels
      });
      toast.success('تم الانتهاء من فحص قاعدة البيانات والعثور على السجلات الشبحية');
    } catch (error) {
      console.error(error);
      toast.error('فشل في فحص قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const cleanLegacyData = async () => {
    const isConfirmed = await confirm(
      'هل أنت متأكد؟',
      'سيتم حذف جميع البيانات القديمة و"الشبحية" (التي بقيت بعد حذف المدن) نهائياً.'
    );
    if (!isConfirmed) return;

    setLoading(true);
    let deletedCount = 0;
    try {
      // 1. Delete legacy top-level
      const legacyHotels = await firestoreGetDocs(collection(db, 'hotels'));
      for (const d of legacyHotels.docs) {
        await deleteDoc(doc(db, 'hotels', d.id));
        deletedCount++;
      }
      const legacyRooms = await firestoreGetDocs(collection(db, 'rooms'));
      for (const d of legacyRooms.docs) {
        await deleteDoc(doc(db, 'rooms', d.id));
        deletedCount++;
      }

      // 2. Delete Orphaned Subcollections
      const allHotelsGroup = await firestoreGetDocs(collectionGroup(db, 'hotels'));
      const citySnap = await firestoreGetDocs(query(collection(db, 'cities')));
      const existingCityIds = new Set(citySnap.docs.map(d => d.id));

      for (const hDoc of allHotelsGroup.docs) {
        const pathParts = hDoc.ref.path.split('/');
        if (pathParts[0] === 'cities') {
          const cityId = pathParts[1];
          if (!existingCityIds.has(cityId)) {
            // This is an orphan! Delete its rooms first
            const roomsSnap = await firestoreGetDocs(collection(db, 'cities', cityId, 'hotels', hDoc.id, 'rooms'));
            for (const rDoc of roomsSnap.docs) {
              await deleteDoc(doc(db, 'cities', cityId, 'hotels', hDoc.id, 'rooms', rDoc.id));
              deletedCount++;
            }
            // Delete the hotel
            await deleteDoc(doc(db, 'cities', cityId, 'hotels', hDoc.id));
            deletedCount++;
          }
        }
      }

      toast.success(`تم إزالة ${deletedCount} سجل (شامل السجلات الشبحية) بنجاح`);
      scanDatabase();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء التنظيف العميق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">مركز صيانة النظام</h1>
        <p className="text-sm text-text-muted font-bold">أدوات هندسية متقدمة لتنظيف وتحسين بنية قاعدة البيانات وضمان النزاهة الهيكلية.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="premium-card border-none bg-card/50 backdrop-blur-xl overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <CardHeader className="p-10 pb-6">
            <CardTitle className="text-2xl font-black flex items-center gap-4">
              <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-75">
                <RefreshCw className="w-6 h-6" />
              </div>
              تحليل العمق الهيكلي
            </CardTitle>
            <CardDescription className="text-text-muted font-bold mt-2">البحث عن السجلات "الشبحية" (Orphaned) التي فقدت مرجعها الأبوي أو تنتمي للهيكل القديم.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-10">
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-muted/30 p-8 rounded-3xl border border-border/40 text-center group-hover:bg-muted/50 transition-colors">
                  <div className="text-4xl font-black text-primary tracking-tighter">{stats.legacyHotels}</div>
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-3">Legacy Hotels</div>
                </div>
                <div className="bg-muted/30 p-8 rounded-3xl border border-border/40 text-center group-hover:bg-muted/50 transition-colors">
                  <div className="text-4xl font-black text-primary tracking-tighter">{stats.legacyRooms}</div>
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-3">Legacy Rooms</div>
                </div>
              </div>
            )}
            <Button 
                onClick={scanDatabase} 
                disabled={loading} 
                className="btn-premium w-full h-16 rounded-3xl font-black gap-3 text-xs uppercase tracking-widest shadow-xl"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {stats ? 'إعادة تحليل النظام' : 'بدء فحص القاعدة'}
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-card border-none bg-destructive/5 overflow-hidden relative group border-t-8 border-t-destructive/20">
          <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Trash2 className="w-48 h-48 text-destructive" />
          </div>
          <CardHeader className="p-10 pb-6">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-destructive">
              <div className="stat-icon-glow bg-destructive/10 text-destructive mb-0 scale-75">
                <Trash2 className="w-6 h-6" />
              </div>
              تطهير البيانات
            </CardTitle>
            <CardDescription className="text-destructive/60 font-bold mt-2">إزالة جذرية لجميع السجلات غير المرجعية للحفاظ على كفاءة النظام.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-10">
            <div className="bg-destructive/5 p-8 rounded-3xl border border-destructive/20 flex items-start gap-6 backdrop-blur-sm">
              <div className="bg-destructive/10 p-3 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-sm text-destructive/80 font-bold leading-relaxed">
                تحذير: هذا الإجراء يحذف البيانات نهائياً. يتم استهداف السجلات التي لم تعد مرتبطة بأي مدينة نشطة في الهيكل الهرمي الجديد.
              </div>
            </div>
            <Button 
                onClick={cleanLegacyData} 
                disabled={loading || !stats || (stats.legacyHotels === 0 && stats.legacyRooms === 0)} 
                variant="destructive" 
                className="w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] gap-3 shadow-2xl shadow-destructive/30 hover:shadow-destructive/40 transition-all border-none"
            >
              <Trash2 className="w-5 h-5" />
              تنفيذ التطهير الشامل الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
