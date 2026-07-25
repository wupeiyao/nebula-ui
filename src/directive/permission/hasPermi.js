import { useAuthStore } from '../../store/auth.js';

/**
 * 按钮权限自定义指令 v-hasPermi="['system:user:add']"
 */
export const hasPermi = {
  mounted(el, binding) {
    const { value } = binding;
    const authStore = useAuthStore();
    const permissions = authStore.permissions || [];

    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value;
      const hasPermissions = permissions.some(permission => {
        return permission === '*:*:*' || permissionFlag.includes(permission);
      });

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(`请指定权限标识，例如 v-hasPermi="['system:user:add']"`);
    }
  }
};

/**
 * JS 检查是否有权限函数
 * @param {Array<String>} value 权限代码列表
 */
export function checkPermi(value) {
  const authStore = useAuthStore();
  const permissions = authStore.permissions || [];
  if (value && value instanceof Array && value.length > 0) {
    return permissions.some(permission => {
      return permission === '*:*:*' || value.includes(permission);
    });
  }
  return false;
}

export default hasPermi;
