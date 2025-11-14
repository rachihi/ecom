import { UPDATE_EMAIL, UPDATE_PROFILE } from '@/constants/constants';
import { ACCOUNT } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import { call, put } from 'redux-saga/effects';
import { history } from '@/routers/AppRouter';
import { setLoading } from '../actions/miscActions';
import { updateProfileSuccess } from '../actions/profileActions';

// Note: Profile update functionality is not yet implemented with API
// This saga is kept for future implementation

function* profileSaga({ type, payload }) {
  switch (type) {
    case UPDATE_EMAIL: {
      try {
        yield put(setLoading(true));

        // TODO: Implement API call to update email
        // const response = yield call(authAPI.updateEmail, payload.password, payload.newEmail);

        yield call(displayActionMessage, 'Email update not yet implemented', 'info');
        yield put(setLoading(false));
        yield call(history.push, ACCOUNT);
      } catch (e) {
        console.log(e.message);
        yield put(setLoading(false));
        yield call(displayActionMessage, 'Failed to update email', 'error');
      }
      break;
    }
    case UPDATE_PROFILE: {
      try {
        yield put(setLoading(true));

        // TODO: Implement API call to update profile
        // For now, just update local state
        yield put(updateProfileSuccess(payload.updates));

        yield put(setLoading(false));
        yield call(history.push, ACCOUNT);
        yield call(displayActionMessage, 'Profile update not yet implemented', 'info');
      } catch (e) {
        console.log(e);
        yield put(setLoading(false));
        yield call(displayActionMessage, 'Failed to update profile', 'error');
      }
      break;
    }
    default: {
      throw new Error('Unexpected action type.');
    }
  }
}

export default profileSaga;
