'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser as deleteApiUser,
  User,
  CreateUserRequest,
  UpdateUserRequest
} from '@/lib/apiClient';
import { useAuthApi } from '@/hooks/useAuthApi';
import UserTable from '@/components/admin/UserTable';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import GenericModal from '@/components/shared/modals/GenericModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const { isAuthenticated } = useAuthApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });
  
  const [updatedUser, setUpdatedUser] = useState<UpdateUserRequest>({
    name: '',
    role: '',
    is_active: true
  });

  // Password validation states
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordMatch, setPasswordMatch] = useState<boolean>(true);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAuthenticated) {
        try {
          const userData = await getUsers(session?.accessToken as string);
          setUsers(userData);
        } catch (error) {
          console.error('Error fetching users:', error);
          alert('فشل تحميل المستخدمين');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [isAuthenticated, session?.accessToken]);

  // Password validation function - matches backend validation exactly
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password), // Matches backend special chars
    };
    setPasswordRequirements(requirements);
  };

  useEffect(() => {
    validatePassword(newUser.password);
    setPasswordMatch(newUser.password === confirmPassword && confirmPassword !== '');
  }, [newUser.password, confirmPassword]);

  const handleCreateUser = async () => {
    // Validate password requirements
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
    if (!allRequirementsMet) {
      alert('الرجاء التأكد من تحقق جميع متطلبات كلمة المرور');
      return;
    }

    if (newUser.password !== confirmPassword) {
      alert('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    try {
      const createdUser = await createUser(newUser, session?.accessToken as string);
      setUsers([...users, createdUser]);
      setNewUser({ email: '', password: '', name: '', role: 'user' });
      setConfirmPassword('');
      setShowCreateDialog(false);
      alert('تم إنشاء المستخدم بنجاح');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('فشل إنشاء المستخدم');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const updatedUserData = await updateUser(
        editingUser.id,
        updatedUser,
        session?.accessToken as string
      );

      setUsers(users.map(u => u.id === editingUser.id ? updatedUserData : u));
      setEditingUser(null);
      setUpdatedUser({ name: '', role: '', is_active: true });
      setShowEditDialog(false);
      alert('تم تحديث المستخدم بنجاح');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('فشل تحديث المستخدم');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteApiUser(userToDelete.id, session?.accessToken as string);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setShowDeleteDialog(false);
      alert('تم حذف المستخدم بنجاح');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('فشل حذف المستخدم');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setUpdatedUser({
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated || session?.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">غير مصرح لك بالوصول إلى هذه الصفحة</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">إدارة المستخدمين</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          إدارة حسابات المستخدمين وصلاحياتهم
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">جاري تحميل المستخدمين...</div>
        </div>
      ) : (
        <UserTable
          users={users}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onAddUser={() => setShowCreateDialog(true)}
        />
      )}

      {/* Create User Modal */}
      <GenericModal
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setNewUser({ email: '', password: '', name: '', role: 'user' });
          setConfirmPassword('');
        }}
        title="إضافة مستخدم جديد"
        description="أدخل معلومات المستخدم الجديد"
        onSubmit={async () => await handleCreateUser()}
        disableSubmit={!Object.values(passwordRequirements).every(req => req) || !passwordMatch}
        submitLabel="إنشاء المستخدم"
      >
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الاسم الكامل
            </label>
            <input
              id="name"
              value={newUser.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({...newUser, name: e.target.value})}
              placeholder="أدخل اسم المستخدم"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({...newUser, email: e.target.value})}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={newUser.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({...newUser, password: e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password requirements checklist */}
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">يجب أن تحتوي كلمة المرور على:</p>
              <ul className="text-sm space-y-1">
                <li className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {passwordRequirements.minLength ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  8 أحرف على الأقل
                </li>
                <li className={`flex items-center ${passwordRequirements.hasUpper ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {passwordRequirements.hasUpper ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  حرف كبير
                </li>
                <li className={`flex items-center ${passwordRequirements.hasLower ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {passwordRequirements.hasLower ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  حرف صغير
                </li>
                <li className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {passwordRequirements.hasNumber ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  رقم
                </li>
                <li className={`flex items-center ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {passwordRequirements.hasSpecial ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  {'رمز خاص (!@#$%^&*()_+-=[]{}|;:,.<>? )'}
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border ${
                  confirmPassword === newUser.password && confirmPassword !== ''
                    ? 'border-green-500'
                    : 'border-slate-300 dark:border-slate-700'
                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !passwordMatch && (
              <p className="mt-1 text-sm text-red-600">كلمة المرور وتأكيد كلمة المرور لا تتطابقان</p>
            )}
            {confirmPassword && passwordMatch && (
              <p className="mt-1 text-sm text-green-600">متطابقة</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الدور
            </label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({...newUser, role: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="user">مستخدم</option>
              <option value="admin">مشرف</option>
            </select>
          </div>
        </div>


      </GenericModal>

      {/* Edit User Modal */}
      <GenericModal
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingUser(null);
          setUpdatedUser({ name: '', role: '', is_active: true });
        }}
        title="تعديل المستخدم"
        description="تعديل معلومات المستخدم"
        onSubmit={async () => await handleUpdateUser()}
        submitLabel="حفظ التغييرات"
      >
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الاسم الكامل
            </label>
            <input
              id="edit-name"
              value={updatedUser.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdatedUser({...updatedUser, name: e.target.value})}
              placeholder="أدخل اسم المستخدم"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الدور
            </label>
            <select
              id="edit-role"
              value={updatedUser.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUpdatedUser({...updatedUser, role: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="user">مستخدم</option>
              <option value="admin">مشرف</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الحالة
            </label>
            <select
              id="edit-status"
              value={updatedUser.is_active ? 'true' : 'false'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUpdatedUser({...updatedUser, is_active: e.target.value === 'true'})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
        </div>


      </GenericModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        message={`هل أنت متأكد أنك تريد حذف المستخدم "${userToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}