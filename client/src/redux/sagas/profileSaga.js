import { UPDATE_EMAIL, UPDATE_PROFILE } from '@/constants/constants';
import { ACCOUNT } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import { call, put } from 'redux-saga/effects';
import { history } from '@/routers/AppRouter';
import { setLoading } from '../actions/miscActions';
import { setProfile, updateProfileSuccess } from '../actions/profileActions';
import { authAPI } from '@/services/api';
import defaultAvatar from '@/images/defaultAvatar.jpg';
import defaultBanner from '@/images/defaultBanner.jpg';

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
        const { updates, files, credentials } = payload;
        yield put(setLoading(true));

        const profileData = {
          fullName: updates.fullname,
          address: updates.address,
          phoneNumber: (typeof updates.mobile === 'object' ? updates.mobile.value : updates.mobile) || ''
        };

        if (files.avatarFile) {
          const formData = new FormData();
          formData.append('file', files.avatarFile);
          const uploadResponse = yield call(authAPI.uploadAvatar, formData);
          if (uploadResponse.data.success) {
            profileData.avatar = uploadResponse.data.url;
          }
        }

        yield call(authAPI.updateProfile, profileData);

        if (credentials.currentPassword && credentials.newPassword) {
          yield call(authAPI.changePassword, credentials.currentPassword, credentials.newPassword);
          yield call(displayActionMessage, 'Password updated successfully', 'success');
        }

        const profileResponse = yield call(authAPI.getProfile);
        const user = {
          id: profileResponse.data._id,
          fullname: profileResponse.data.fullName,
          email: profileResponse.data.email,
          phoneNumber: profileResponse.data.phoneNumber,
          address: profileResponse.data.address,
          role: 'CUSTOMER',
          avatar: profileResponse.data.avatar || defaultAvatar,
          banner: defaultBanner,
        };
        yield put(setProfile(user));

        yield put(setLoading(false));
        yield call(history.push, ACCOUNT);
        yield call(displayActionMessage, 'Profile updated successfully', 'success');
      } catch (e) {
        console.log(e);
        yield put(setLoading(false));
        yield call(displayActionMessage, e?.response?.data?.error || 'Failed to update profile', 'error');
      }
      break;
    }
    default: {
      throw new Error('Unexpected action type.');
    }
  }
}

export default profileSaga;
