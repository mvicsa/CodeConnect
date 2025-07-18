'use client'

import { ReactNode, useEffect } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './store'
import { fetchProfile } from './slices/authSlice'
import { RootState, AppDispatch } from './store'

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>()
  const { initialized, token } = useSelector((state: RootState) => state.auth)
  useEffect(() => {
    if (!initialized && token) {
      dispatch(fetchProfile())
    }
  }, [initialized, token, dispatch])
  return null
}

export default function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      {children}
    </Provider>
  )
}
