import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn } from './firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ShieldAlert } from 'lucide-react';
import { toast } from './swal';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('خطأ في النطاق: هذا النطاق غير مصرح به في إعدادات Firebase. يرجى التأكد من إضافة رابط التطبيق الحالي إلى قائمة النطاقات المسموح بها.');
      } else {
        toast.error('فشل تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 font-sans">
        <Card className="w-full max-w-md card-minimal shadow-xl">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-6 shadow-sm shadow-primary/5">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black text-text-main tracking-tight">لوحة تحكم المدير</CardTitle>
            <CardDescription className="text-text-muted mt-2 px-6">
              يرجى تسجيل الدخول باستخدام حساب مسؤول معتمد لإدارة نظام حجز الفنادق.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-8 pt-4">
            <Button onClick={handleSignIn} className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/10" size="lg">
              <LogIn className="ml-2 h-5 w-5" /> تسجيل الدخول بواسطة جوجل
            </Button>
            <p className="text-[10px] text-center text-text-muted uppercase tracking-widest font-bold mt-4">نظام إدارة الفنادق الآمن</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if admin (based on the rules provided by user)
  const allowedAdmins = ["shadyabdowd2020@gmail.com", "otdragoze@gmail.com", "gidehotel@gmail.com"];
  const isAdmin = user.email && allowedAdmins.includes(user.email);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 font-sans">
        <Card className="w-full max-w-md card-minimal shadow-xl border-destructive/20">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-destructive/10 p-4 rounded-2xl w-fit mb-6 shadow-sm shadow-destructive/5">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-black text-destructive tracking-tight">تم رفض الوصول</CardTitle>
            <CardDescription className="text-text-muted mt-2 px-6">
              حسابك ({user.email}) لا يمتلك صلاحيات إدارية. يرجى التواصل مع المسؤول الرئيسي.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <Button variant="outline" onClick={() => auth.signOut()} className="w-full h-12 font-bold border-2">
              تسجيل الخروج وتجربة حساب آخر
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
