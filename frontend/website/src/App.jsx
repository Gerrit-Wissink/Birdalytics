import {HashRouter as Router, Routes, Route} from "react-router-dom"
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CamInfo from "./pages/cameraInfo"
import Cameras from "./pages/cameras"
import LogIn from "./pages/login"
import Upload from "./pages/upload"
import ValGrid from "./pages/valGrid"
import Overview from "./pages/overview"
import Reports from "./pages/reports"
import NavLayout from "./components/navLayout"

import './App.css'

const theme = createTheme();

function App() {

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route element={<NavLayout/>}>
          <Route path="/login" element={<LogIn/>}/>
          <Route path="/" element={<Overview/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/upload" element={<Upload/>}/>
          <Route path="/valgrid" element={<ValGrid/>}/>
          <Route path="/caminfo" element={<CamInfo/>} />
          <Route path="/cameras" element={<Cameras/>} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
