import {
  ON_AUTHSTATE_FAIL,
  ON_AUTHSTATE_SUCCESS, RESET_PASSWORD,
  SET_AUTH_PERSISTENCE,
  SIGNIN, SIGNIN_WITH_FACEBOOK,
  SIGNIN_WITH_GITHUB, SIGNIN_WITH_GOOGLE,
  SIGNOUT, SIGNUP
} from '@/constants/constants';
import { SIGNIN as ROUTE_SIGNIN } from '@/constants/routes';
import defaultAvatar from '@/images/defaultAvatar.jpg';
import defaultBanner from '@/images/defaultBanner.jpg';
import { call, put } from 'redux-saga/effects';
import { signInSuccess, signOutSuccess } from '@/redux/actions/authActions';
import { clearBasket, setBasketItems } from '@/redux/actions/basketActions';
import { resetCheckout } from '@/redux/actions/checkoutActions';
import { resetFilter } from '@/redux/actions/filterActions';
import { setAuthenticating, setAuthStatus } from '@/redux/actions/miscActions';
import { clearProfile, setProfile } from '@/redux/actions/profileActions';
import { history } from '@/routers/AppRouter';
import { authAPI } from '@/services/api';

function* handleError(e) {
  const obj = { success: false, type: 'auth', isError: true };
  yield put(setAuthenticating(false));

  switch (e.code) {
    case 'auth/network-request-failed':
      yield put(setAuthStatus({ ...obj, message: 'Network error has occured. Please try again.' }));
      break;
    case 'auth/email-already-in-use':
      yield put(setAuthStatus({ ...obj, message: 'Email is already in use. Please use another email' }));
      break;
    case 'auth/wrong-password':
      yield put(setAuthStatus({ ...obj, message: 'Incorrect email or password' }));
      break;
    case 'auth/user-not-found':
      yield put(setAuthStatus({ ...obj, message: 'Incorrect email or password' }));
      break;
    case 'auth/reset-password-error':
      yield put(setAuthStatus({ ...obj, message: 'Failed to send password reset email. Did you type your email correctly?' }));
      break;
    default:
      yield put(setAuthStatus({ ...obj, message: e.message }));
      break;
  }
}

function* initRequest() {
  yield put(setAuthenticating());
  yield put(setAuthStatus({}));
}

function* authSaga({ type, payload }) {
  switch (type) {
    case SIGNIN:
      try {
        yield initRequest();
        const response = yield call(authAPI.signin, payload.email, payload.password);

        if (response.data.token) {
          // Save token to localStorage
          localStorage.setItem('serviceToken', response.data.token);

          // Set customer profile
          const user = {
            id: response.data.customer._id,
            fullname: response.data.customer.fullName,
            email: response.data.customer.email,
            phoneNumber: response.data.customer.phoneNumber,
            address: response.data.customer.address,
            role: 'CUSTOMER',
            avatar: defaultAvatar,
            banner: defaultBanner,
          };

          yield put(setProfile(user));
          yield put(signInSuccess(user));
          yield put(setAuthenticating(false));
        } else {
          throw new Error('Login failed');
        }
      } catch (e) {
        yield handleError(e);
      }
      break;
    case SIGNIN_WITH_GOOGLE:
      try {
        yield initRequest();
        // Google sign-in not supported with API backend
        yield handleError({ message: 'Google sign-in not available. Please use email/password.' });
      } catch (e) {
        yield handleError(e);
      }
      break;
    case SIGNIN_WITH_FACEBOOK:
      try {
        yield initRequest();
        // Facebook sign-in not supported with API backend
        yield handleError({ message: 'Facebook sign-in not available. Please use email/password.' });
      } catch (e) {
        yield handleError(e);
      }
      break;
    case SIGNIN_WITH_GITHUB:
      try {
        yield initRequest();
        // GitHub sign-in not supported with API backend
        yield handleError({ message: 'GitHub sign-in not available. Please use email/password.' });
      } catch (e) {
        yield handleError(e);
      }
      break;
    case SIGNUP:
      try {
        yield initRequest();

        const fullName = payload.fullname.split(' ').map((name) => name[0].toUpperCase().concat(name.substring(1))).join(' ');
        const phoneNumber = payload.phoneNumber || '0000000000'; // Default if not provided
        const address = payload.address || '';

        const response = yield call(authAPI.signup, fullName, payload.email, payload.password, phoneNumber, address);

        if (response.data.token) {
          // Save token to localStorage
          localStorage.setItem('serviceToken', response.data.token);

          // Set customer profile
          const user = {
            id: response.data.customer._id,
            fullname: response.data.customer.fullName,
            email: response.data.customer.email,
            phoneNumber: response.data.customer.phoneNumber,
            address: response.data.customer.address,
            role: 'CUSTOMER',
            avatar: defaultAvatar,
            banner: defaultBanner,
          };

          yield put(setProfile(user));
          yield put(signInSuccess(user));
          yield put(setAuthenticating(false));
        } else {
          throw new Error('Signup failed');
        }
      } catch (e) {
        yield handleError(e);
      }
      break;
    case SIGNOUT: {
      try {
        yield initRequest();
        yield call(authAPI.signout);
        yield put(clearBasket());
        yield put(clearProfile());
        yield put(resetFilter());
        yield put(resetCheckout());
        yield put(signOutSuccess());
        yield put(setAuthenticating(false));
        yield call(history.push, ROUTE_SIGNIN);
      } catch (e) {
        console.log(e);
      }
      break;
    }
    case RESET_PASSWORD: {
      try {
        yield initRequest();
        // Password reset not implemented with API backend yet
        yield put(setAuthStatus({
          success: false,
          type: 'reset',
          message: 'Password reset feature is not available yet.'
        }));
        yield put(setAuthenticating(false));
      } catch (e) {
        handleError({ code: 'auth/reset-password-error' });
      }
      break;
    }
    case ON_AUTHSTATE_SUCCESS: {
      // Check if customer is authenticated via token
      const token = localStorage.getItem('serviceToken');

      if (token) {
        try {
          // Get customer profile from API
          const response = yield call(authAPI.getProfile);
          const user = {
            id: response.data._id,
            fullname: response.data.fullName,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber,
            address: response.data.address,
            role: 'CUSTOMER',
            avatar: defaultAvatar,
            banner: defaultBanner,
          };

          yield put(setProfile(user));
          yield put(setBasketItems([]));
          yield put(signInSuccess({
            id: user.id,
            role: user.role,
            provider: 'api'
          }));
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Token invalid, clear it
          localStorage.removeItem('serviceToken');
        }
      }
      break;
    }
    case ON_AUTHSTATE_FAIL: {
      yield put(clearProfile());
      yield put(signOutSuccess());
      break;
    }
    case SET_AUTH_PERSISTENCE: {
      // Auth persistence is handled by localStorage token
      // No action needed
      break;
    }
    default:
      break;
  }
}

export default authSaga;
