import { createContext, useEffect, useReducer, ReactElement } from 'react';

// third-party
import { Chance } from 'chance';
import { jwtDecode } from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'store/reducers/actions';
import authReducer from 'store/reducers/auth';

// project-imports
import Loader from 'components/Loader';
import axios from 'utils/axios';
import { KeyedObject } from 'types/root';
import { AuthProps, JWTContextType } from 'types/auth';

const chance = new Chance();

// constant
const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken: (st: string) => boolean = (serviceToken) => {
  if (!serviceToken) {
    return false;
  }
  const decoded: KeyedObject = jwtDecode(serviceToken);

  /**
   * Property 'exp' does not exist on type '<T = unknown>(token: string, options?: JwtDecodeOptions | undefined) => T'.
   */
  return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken?: string | null) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    const bearer = `Bearer ${serviceToken}`;
    axios.defaults.headers.common.Authorization = bearer;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);

          // Fetch user profile from API
          try {
            const response = await axios.get('/api/user/profile');
            const userData = response.data.user;

            const profile = {
              id: userData._id,
              name: userData.name,
              email: userData.email,
              phoneNumber: userData.phoneNumber,
              role: userData.role === 1 ? 'admin' : userData.role === 0 ? 'customer' : undefined,
              userImage: userData.userImage,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt
            };

            dispatch({
              type: LOGIN,
              payload: {
                isLoggedIn: true,
                user: profile
              }
            });
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If profile fetch fails, logout
            setSession(null);
            dispatch({ type: LOGOUT });
          }
        } else {
          dispatch({ type: LOGOUT });
        }
      } catch (err) {
        console.error(err);
        dispatch({ type: LOGOUT });
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/signin', { email, password });
    if (response.data?.error) throw new Error(response.data.error);
    const { token } = response.data;
    setSession(token);

    // Fetch full user profile after login
    try {
      const profileResponse = await axios.get('/api/user/profile');
      const userData = profileResponse.data.user;

      const profile = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role === 1 ? 'admin' : userData.role === 0 ? 'customer' : undefined,
        userImage: userData.userImage,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

      dispatch({
        type: LOGIN,
        payload: {
          isLoggedIn: true,
          user: profile
        }
      });
    } catch (error) {
      console.error('Failed to fetch user profile after login:', error);
      // If profile fetch fails, logout
      setSession(null);
      throw new Error('Failed to load user profile');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // todo: this flow need to be recode as it not verified
    const id = chance.bb_pin();
    const response = await axios.post('/api/signup', {
      email,
      password,
      cPassword: password,
      name
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers!),
        {
          id,
          email,
          password,
          name
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const logout = () => {
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async (email: string) => {
    console.log('email - ', email);
  };

  const updateProfile = () => {};

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <JWTContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext.Provider>;
};

export default JWTContext;
