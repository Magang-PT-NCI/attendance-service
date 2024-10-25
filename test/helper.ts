import { EMPLOYEE_SERVICE_URL } from '../src/config/service.config';
import axios from 'axios';

interface LoginResBody {
  nik: string;
  user_role: string;
  profile_photo: string;
  token: string;
}

export const getToken = async (
  nik: string,
  password: string,
): Promise<LoginResBody> => {
  try {
    const response = await axios.post(`${EMPLOYEE_SERVICE_URL}/login`, {
      nik,
      password,
    });
    return response.data;
  } catch {
    return null;
  }
};
