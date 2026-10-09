'use client';

import { createContext, useContext } from 'react';

/** The signed-in admin and the admin list, for owner pickers and labels. */
export const AdminSessionContext = createContext({ admin: null, admins: [] });

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

export function adminLabel(admin) {
  return admin?.email || admin?.username || 'Admin';
}
