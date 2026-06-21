import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type Step = 'DETAILS' | 'OTP_SENT' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

export interface FormData {
  name: string;
  email: string;
  phone: string;
  skills: string;
  availability: string;
  comments: string;
}

export interface RegistrationState {
  step: Step;
  formData: FormData;
  loading: boolean;
  error: string;
}

type RegistrationAction =
  | { type: 'UPDATE_FORM'; payload: Partial<FormData> }
  | { type: 'SUBMIT_DETAILS' }
  | { type: 'OTP_SENT' }
  | { type: 'VERIFY_OTP' }
  | { type: 'REGISTRATION_SUCCESS' }
  | { type: 'REGISTRATION_ERROR'; payload: string }
  | { type: 'RESET' };

const initialFormState: FormData = {
  name: '',
  email: '',
  phone: '',
  skills: '',
  availability: 'Weekends',
  comments: '',
};

const initialState: RegistrationState = {
  step: 'DETAILS',
  formData: initialFormState,
  loading: false,
  error: '',
};

function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case 'UPDATE_FORM':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case 'SUBMIT_DETAILS':
      return {
        ...state,
        loading: true,
        error: '',
      };
    case 'OTP_SENT':
      return {
        ...state,
        step: 'OTP_SENT',
        loading: false,
        error: '',
      };
    case 'VERIFY_OTP':
      return {
        ...state,
        loading: true,
        error: '',
      };
    case 'REGISTRATION_SUCCESS':
      return {
        ...state,
        step: 'SUCCESS',
        loading: false,
        error: '',
      };
    case 'REGISTRATION_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'RESET':
      return {
        ...initialState,
        formData: { ...initialFormState },
      };
    default:
      return state;
  }
}

interface RegistrationContextProps {
  state: RegistrationState;
  dispatch: React.Dispatch<RegistrationAction>;
}

const RegistrationContext = createContext<RegistrationContextProps | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  return (
    <RegistrationContext.Provider value={{ state, dispatch }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
