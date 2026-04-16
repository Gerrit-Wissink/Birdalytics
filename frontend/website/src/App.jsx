import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CamInfo from "./pages/camInfo"
import Login from "./pages/login"
import Upload from "./pages/upload"
import ValGrid from "./pages/valGrid"
import Overview from "./pages/overview"
import Reports from "./pages/reports"
import Activity from './pages/activity'
import NavLayout from "./components/navLayout"

import './App.css'

const theme = createTheme();

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  const isExpired = tokenExpiry ? new Date(tokenExpiry) < new Date() : false;

  if (!token || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login/>}/>

          {/* commenting out
          <Route element={<NavLayout/>}>
          <Route path="/" element={<Overview/>}/>
          <Route path="/activity" element = {<Activity/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/upload" element={<Upload/>}/>
          <Route path="/valgrid" element={<ValGrid/>}/>
          <Route path="/cameras" element={<CamInfo/>} />
          </Route>
          */}

          <Route
            element={
              <ProtectedRoute>
                <NavLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Overview/>}/>
            <Route path="/activity" element = {<Activity/>}/>
            <Route path="/reports" element={<Reports/>}/>
            <Route path="/upload" element={<Upload/>}/>
            <Route path="/valgrid" element={<ValGrid/>}/>
            <Route path="/cameras" element={<CamInfo/>} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
