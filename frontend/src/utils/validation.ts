//validation.tsx
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una mayúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatPhoneNumber = (phone: string): string => {
  // Formato básico de número de teléfono
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};