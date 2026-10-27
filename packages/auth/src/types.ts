// Usuario de la app principal, tal como lo ve la comunidad. No depende del
// proveedor de login: cada adaptador traduce su sesión a esta forma.
export interface AuthUser {
  /** Id estable del usuario en la app principal. */
  uid: string;
  email: string | null;
  /** Solo un correo verificado puede dar permisos (por ejemplo, de admin). */
  emailVerified: boolean;
  name: string | null;
  image: string | null;
}

// Un adaptador verifica la cookie de sesión que crea la app principal. Para
// conectar la comunidad a otra app principal basta con escribir otro.
export interface AuthAdapter {
  verifySession(cookieValue: string): Promise<AuthUser | null>;
}
