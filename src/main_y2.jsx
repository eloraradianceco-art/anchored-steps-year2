import React from 'react'
import ReactDOM from 'react-dom/client'
import AnchoredStepsY2 from './App_Y2.jsx'
import ResetPassword from './ResetPassword.jsx'

const isReset = window.location.pathname === '/reset-password'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isReset ? <ResetPassword /> : <AnchoredStepsY2 />}
  </React.StrictMode>
)
